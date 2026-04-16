import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BlogPostEntity } from '../../db/entities/blog.entity.js';
import { CategoryEntity } from '../../db/entities/product.entity.js';
import { BlogPostStatus } from '../../db/entities/enums.js';
import { BlogTranslationsService } from './blog-translations.service.js';

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export interface CreateBlogPostData {
  title: string;
  content?: string | null;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  categoryIds?: string[];
  status?: BlogPostStatus;
}

export interface UpdateBlogPostData {
  title?: string;
  content?: string | null;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  categoryIds?: string[];
  status?: BlogPostStatus;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generates a URL-safe slug from a title string.
 * Converts to lowercase, replaces non-alphanumeric characters with hyphens,
 * collapses consecutive hyphens, trims leading/trailing hyphens, and appends
 * a 4-character random alphanumeric suffix for uniqueness.
 */
function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036F]/g, '') // strip diacritics
    .replaceAll(/[^a-z0-9\s-]/g, '')
    .trim()
    .replaceAll(/[\s-]+/g, '-')
    // eslint-disable-next-line sonarjs/slow-regex
    .replaceAll(/^-+|-+$/g, '');

  // eslint-disable-next-line sonarjs/pseudo-random -- used for non-security slug suffix generation
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class BlogsService {
  private readonly logger = new Logger(BlogsService.name);

  constructor(
    @InjectRepository(BlogPostEntity)
    private readonly blogRepo: Repository<BlogPostEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepo: Repository<CategoryEntity>,
    private readonly translations: BlogTranslationsService,
  ) {}

  // ---------------------------------------------------------------------------
  // Public endpoints
  // ---------------------------------------------------------------------------

  /**
   * Returns all published posts ordered by publishedAt DESC.
   * Used by the public blog listing page.
   */
  async findAllPublished(): Promise<BlogPostEntity[]> {
    return this.blogRepo.find({
      where: { status: BlogPostStatus.PUBLISHED },
      order: { publishedAt: 'DESC' },
    });
  }

  /**
   * Returns a single published post by slug and increments viewCount.
   * Throws NotFoundException if the post does not exist or is not published.
   */
  async findBySlug(slug: string): Promise<BlogPostEntity> {
    const post = await this.blogRepo.findOne({
      where: { slug, status: BlogPostStatus.PUBLISHED },
    });

    if (!post) {
      throw new NotFoundException(`Blog post with slug "${slug}" not found`);
    }

    // Increment view count (fire-and-forget — do not block the response)
    void this.blogRepo
      .increment({ id: post.id }, 'viewCount', 1)
      .catch((error) => {
        this.logger.warn(
          `Failed to increment viewCount for post ${post.id}: ${String(error)}`,
        );
      });

    return post;
  }

  // ---------------------------------------------------------------------------
  // Coach-scoped endpoints
  // ---------------------------------------------------------------------------

  /**
   * Returns all posts (including drafts) authored by the given coachId.
   * coachId maps to BlogPostEntity.authorId.
   */
  async findByCoach(coachId: string): Promise<BlogPostEntity[]> {
    return this.blogRepo.find({
      where: { authorId: coachId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Returns a single post owned by the given coachId.
   * Throws NotFoundException if the post does not exist or does not belong to the coach.
   */
  async findOneByCoach(id: string, coachId: string): Promise<BlogPostEntity> {
    const post = await this.blogRepo.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException(`Blog post "${id}" not found`);
    }

    if (post.authorId !== coachId) {
      throw new ForbiddenException(
        'You do not have permission to access this post',
      );
    }

    return post;
  }

  /**
   * Creates a new blog post for the authenticated coach.
   * Generates a slug from the title automatically.
   */
  async create(
    coachId: string,
    data: CreateBlogPostData,
  ): Promise<BlogPostEntity> {
    const slug = generateSlug(data.title);

    const status = data.status ?? BlogPostStatus.DRAFT;

    const categories =
      data.categoryIds && data.categoryIds.length > 0
        ? await this.categoryRepo.find({
            where: { id: In(data.categoryIds) },
          })
        : [];

    const entity = this.blogRepo.create({
      authorId: coachId,
      title: data.title,
      slug,
      content: data.content ?? null,
      excerpt: data.excerpt ?? null,
      coverImageUrl: data.coverImageUrl ?? null,
      categories,
      status,
      publishedAt: status === BlogPostStatus.PUBLISHED ? new Date() : null,
    });

    const saved = await this.blogRepo.save(entity);

    // Auto-translate to other languages in background
    this.translations.translateToOtherLanguages(saved.id, 'pl');

    return saved;
  }

  /**
   * Partially updates a blog post owned by the authenticated coach.
   * If status transitions to PUBLISHED, sets publishedAt to now().
   * Throws ForbiddenException if the post belongs to another coach.
   */
  async update(
    id: string,
    coachId: string,
    data: UpdateBlogPostData,
  ): Promise<BlogPostEntity> {
    const post = await this.findOneByCoach(id, coachId);

    if (data.title !== undefined) post.title = data.title;
    if (data.content !== undefined) post.content = data.content;
    if (data.excerpt !== undefined) post.excerpt = data.excerpt;
    if (data.coverImageUrl !== undefined)
      post.coverImageUrl = data.coverImageUrl;

    if (data.categoryIds !== undefined) {
      post.categories =
        data.categoryIds.length > 0
          ? await this.categoryRepo.find({
              where: { id: In(data.categoryIds) },
            })
          : [];
    }

    if (data.status !== undefined) {
      if (
        data.status === BlogPostStatus.PUBLISHED &&
        post.status !== BlogPostStatus.PUBLISHED
      ) {
        post.publishedAt = new Date();
      }
      post.status = data.status;
    }

    const saved = await this.blogRepo.save(post);

    // Auto-translate if translatable content changed
    const contentChanged =
      data.title !== undefined ||
      data.content !== undefined ||
      data.excerpt !== undefined;
    if (contentChanged) {
      this.translations.translateToOtherLanguages(saved.id, 'pl');
    }

    return saved;
  }

  /**
   * Hard-deletes a post owned by the authenticated coach.
   * Throws ForbiddenException if the post belongs to another coach.
   */
  async remove(id: string, coachId: string): Promise<void> {
    // Verify ownership (throws NotFoundException / ForbiddenException if invalid)
    await this.findOneByCoach(id, coachId);
    await this.blogRepo.delete({ id });
  }

  /**
   * Toggles a like on a post by userId.
   * Because we only track the aggregate count (no per-user like table yet),
   * this uses a simple increment/decrement based on a client-sent toggle flag.
   *
   * Returns the new likeCount.
   */
  async toggleLike(
    postId: string,
    _userId: string,
    increment: boolean,
  ): Promise<number> {
    const post = await this.blogRepo.findOne({
      where: { id: postId, status: BlogPostStatus.PUBLISHED },
    });

    if (!post) {
      throw new NotFoundException(`Blog post "${postId}" not found`);
    }

    if (increment) {
      await this.blogRepo.increment({ id: postId }, 'likeCount', 1);
    } else {
      // Ensure likeCount never goes below 0
      const current = post.likeCount ?? 0;
      if (current > 0) {
        await this.blogRepo.decrement({ id: postId }, 'likeCount', 1);
      }
    }

    const updated = await this.blogRepo.findOneOrFail({
      where: { id: postId },
    });
    return updated.likeCount ?? 0;
  }
}
