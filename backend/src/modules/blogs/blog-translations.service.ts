import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPostEntity } from '../../db/entities/blog.entity.js';
import { BlogPostTranslationEntity } from '../../db/entities/blog-translation.entity.js';
import { OllamaService } from '../../core/ollama.service.js';

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * Manages AI-powered translations for blog posts.
 *
 * Translations run via Ollama (local LLM) and are stored in the
 * blog_post_translations table. Each (post_id, language_code) pair is unique —
 * re-translating a post upserts the existing row.
 *
 * All translation methods are designed to be called fire-and-forget from the
 * controller (background job pattern). Errors are logged but never thrown so
 * a failed translation does not crash the request cycle.
 */
@Injectable()
export class BlogTranslationsService {
  private readonly logger = new Logger(BlogTranslationsService.name);

  constructor(
    @InjectRepository(BlogPostEntity)
    private readonly blogRepo: Repository<BlogPostEntity>,
    @InjectRepository(BlogPostTranslationEntity)
    private readonly translationRepo: Repository<BlogPostTranslationEntity>,
    private readonly ollama: OllamaService,
  ) {}

  // ---------------------------------------------------------------------------
  // Write
  // ---------------------------------------------------------------------------

  /**
   * Translates a blog post into the target language and upserts the result.
   * Runs field translations sequentially to avoid overloading the CPU-bound
   * Ollama process. Caller should NOT await this — fire and forget.
   *
   * @param postId     - UUID of the blog post to translate
   * @param targetLang - BCP-47 target language code ('en' | 'es')
   * @param sourceLang - BCP-47 source language code (default: 'pl')
   */
  async translatePost(
    postId: string,
    targetLang: string,
    sourceLang: string = 'pl',
  ): Promise<void> {
    this.logger.log(
      `Starting translation: post=${postId} ${sourceLang}→${targetLang}`,
    );

    let post: BlogPostEntity;
    try {
      const found = await this.blogRepo.findOne({ where: { id: postId } });
      if (!found) {
        throw new NotFoundException(`Blog post "${postId}" not found`);
      }
      post = found;
    } catch (error) {
      this.logger.error(
        `translatePost: could not load post ${postId}: ${String(error)}`,
      );
      return;
    }

    try {
      // Translate fields sequentially — CPU inference cannot parallelise well
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

      // Upsert — ON CONFLICT (post_id, language_code) DO UPDATE
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

      this.logger.log(
        `Translation complete: post=${postId} ${sourceLang}→${targetLang}`,
      );
    } catch (error) {
      this.logger.error(
        `translatePost failed for post=${postId} ${sourceLang}→${targetLang}: ${String(error)}`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Read
  // ---------------------------------------------------------------------------

  /**
   * Returns all translations for a given post.
   */
  async getTranslations(postId: string): Promise<BlogPostTranslationEntity[]> {
    return this.translationRepo.find({
      where: { postId },
      order: { languageCode: 'ASC' },
    });
  }

  /**
   * Returns a specific translation by post ID and language code.
   * Returns null if no translation exists yet.
   */
  async getTranslation(
    postId: string,
    lang: string,
  ): Promise<BlogPostTranslationEntity | null> {
    return this.translationRepo.findOne({
      where: { postId, languageCode: lang },
    });
  }

  /**
   * Returns a lightweight status list showing which languages have been
   * translated and when — useful for the admin UI translation dashboard.
   */
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
}
