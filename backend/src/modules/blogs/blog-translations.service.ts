import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPostEntity } from '../../db/entities/blog.entity.js';
import { BlogPostTranslationEntity } from '../../db/entities/blog-translation.entity.js';
import { OllamaService } from '../../core/ollama.service.js';

// All supported languages
const ALL_LANGS = ['pl', 'en', 'es'] as const;

interface TranslationJob {
  postId: string;
  sourceLang: string;
  targetLang: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class BlogTranslationsService {
  private readonly logger = new Logger(BlogTranslationsService.name);

  // FIFO queue + mutex — only 1 translation runs at a time on CPU
  private readonly queue: TranslationJob[] = [];
  private isProcessing = false;

  constructor(
    @InjectRepository(BlogPostEntity)
    private readonly blogRepo: Repository<BlogPostEntity>,
    @InjectRepository(BlogPostTranslationEntity)
    private readonly translationRepo: Repository<BlogPostTranslationEntity>,
    private readonly ollama: OllamaService,
  ) {}

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Enqueue translation of a single post to a single target language.
   * Deduplicates: if the same (postId, targetLang) is already queued, skips.
   * Non-blocking — returns immediately.
   */
  translatePost(
    postId: string,
    targetLang: string,
    sourceLang: string = 'pl',
  ): void {
    this.enqueue({ postId, sourceLang, targetLang });
  }

  /**
   * Auto-translate: enqueue translations to ALL other languages.
   * Called automatically after a blog post is saved/updated.
   * E.g. sourceLang='pl' → enqueues 'en' and 'es'.
   */
  translateToOtherLanguages(postId: string, sourceLang: string = 'pl'): void {
    const targets = ALL_LANGS.filter((l) => l !== sourceLang);
    for (const targetLang of targets) {
      this.enqueue({ postId, sourceLang, targetLang });
    }
  }

  // ---------------------------------------------------------------------------
  // Queue
  // ---------------------------------------------------------------------------

  private enqueue(job: TranslationJob): void {
    // Deduplicate — don't add if same post+target is already queued
    const isDuplicate = this.queue.some(
      (j) => j.postId === job.postId && j.targetLang === job.targetLang,
    );
    if (isDuplicate) {
      this.logger.debug(
        `Skipping duplicate: post=${job.postId} →${job.targetLang}`,
      );
      return;
    }

    this.queue.push(job);
    this.logger.log(
      `Enqueued: post=${job.postId} ${job.sourceLang}→${job.targetLang} (queue: ${this.queue.length})`,
    );

    // Start processing if not already running
    void this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift()!;
      await this.executeTranslation(job);
    }

    this.isProcessing = false;
  }

  // ---------------------------------------------------------------------------
  // Translation execution
  // ---------------------------------------------------------------------------

  private async executeTranslation(job: TranslationJob): Promise<void> {
    const { postId, sourceLang, targetLang } = job;
    this.logger.log(`Translating: post=${postId} ${sourceLang}→${targetLang}`);

    let post: BlogPostEntity;
    try {
      const found = await this.blogRepo.findOne({ where: { id: postId } });
      if (!found) {
        throw new NotFoundException(`Blog post "${postId}" not found`);
      }
      post = found;
    } catch (error) {
      this.logger.error(`Could not load post ${postId}: ${String(error)}`);
      return;
    }

    try {
      // Sequential — CPU inference cannot parallelise
      const translatedTitle = post.title
        ? await this.ollama.translate(post.title, sourceLang, targetLang)
        : null;

      const translatedContent =
        post.content && post.content.length > 0
          ? await this.ollama.translate(post.content, sourceLang, targetLang)
          : null;

      const translatedExcerpt = post.excerpt
        ? await this.ollama.translate(post.excerpt, sourceLang, targetLang)
        : null;

      // Upsert
      await this.translationRepo
        .createQueryBuilder()
        .insert()
        .into(BlogPostTranslationEntity)
        .values({
          postId,
          languageCode: targetLang,
          title: translatedTitle,
          content: translatedContent,
          excerpt: translatedExcerpt,
          isAutoTranslated: true,
          translatedAt: new Date(),
        })
        .orUpdate(
          [
            'title',
            'content',
            'excerpt',
            'is_auto_translated',
            'translated_at',
            'updated_at',
          ],
          ['post_id', 'language_code'],
        )
        .execute();

      this.logger.log(`Done: post=${postId} ${sourceLang}→${targetLang}`);
    } catch (error) {
      this.logger.error(
        `Failed: post=${postId} ${sourceLang}→${targetLang}: ${String(error)}`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Read
  // ---------------------------------------------------------------------------

  async getTranslations(postId: string): Promise<BlogPostTranslationEntity[]> {
    return this.translationRepo.find({
      where: { postId },
      order: { languageCode: 'ASC' },
    });
  }

  async getTranslation(
    postId: string,
    lang: string,
  ): Promise<BlogPostTranslationEntity | null> {
    return this.translationRepo.findOne({
      where: { postId, languageCode: lang },
    });
  }

  async getTranslationStatus(
    postId: string,
  ): Promise<{ lang: string; translatedAt: string }[]> {
    const translations = await this.translationRepo.find({
      where: { postId },
      select: ['languageCode', 'translatedAt'],
      order: { languageCode: 'ASC' },
    });

    return translations.map((t) => ({
      lang: t.languageCode,
      translatedAt: t.translatedAt?.toISOString() ?? '',
    }));
  }

  /**
   * Returns current queue size — useful for debugging.
   */
  getQueueSize(): number {
    return this.queue.length;
  }
}
