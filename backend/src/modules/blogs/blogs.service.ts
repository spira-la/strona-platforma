import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPostEntity } from '../../db/entities/blog.entity.js';

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export interface CreateBlogPostData {
  title: string;
  content?: string | null;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  tags?: string[] | null;
  isPublished?: boolean;
}

export interface UpdateBlogPostData {
  title?: string;
  content?: string | null;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  tags?: string[] | null;
  isPublished?: boolean;
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
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');

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
      where: { isPublished: true },
      order: { publishedAt: 'DESC' },
    });
  }

  /**
   * Returns a single published post by slug and increments viewCount.
   * Throws NotFoundException if the post does not exist or is not published.
   */
  async findBySlug(slug: string): Promise<BlogPostEntity> {
    const post = await this.blogRepo.findOne({
      where: { slug, isPublished: true },
    });

    if (!post) {
      throw new NotFoundException(`Blog post with slug "${slug}" not found`);
    }

    // Increment view count (fire-and-forget — do not block the response)
    void this.blogRepo.increment({ id: post.id }, 'viewCount', 1).catch((err) => {
      this.logger.warn(`Failed to increment viewCount for post ${post.id}: ${String(err)}`);
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
      throw new ForbiddenException('You do not have permission to access this post');
    }

    return post;
  }

  /**
   * Creates a new blog post for the authenticated coach.
   * Generates a slug from the title automatically.
   */
  async create(coachId: string, data: CreateBlogPostData): Promise<BlogPostEntity> {
    const slug = generateSlug(data.title);

    const entity = this.blogRepo.create({
      authorId: coachId,
      title: data.title,
      slug,
      content: data.content ?? null,
      excerpt: data.excerpt ?? null,
      coverImageUrl: data.coverImageUrl ?? null,
      tags: data.tags ?? null,
      isPublished: data.isPublished ?? false,
      publishedAt: data.isPublished ? new Date() : null,
    });

    return this.blogRepo.save(entity);
  }

  /**
   * Partially updates a blog post owned by the authenticated coach.
   * If isPublished transitions to true, sets publishedAt to now().
   * Throws ForbiddenException if the post belongs to another coach.
   */
  async update(id: string, coachId: string, data: UpdateBlogPostData): Promise<BlogPostEntity> {
    const post = await this.findOneByCoach(id, coachId);

    const patch: Partial<BlogPostEntity> = {};

    if (data.title !== undefined) patch.title = data.title;
    if (data.content !== undefined) patch.content = data.content;
    if (data.excerpt !== undefined) patch.excerpt = data.excerpt;
    if (data.coverImageUrl !== undefined) patch.coverImageUrl = data.coverImageUrl;
    if (data.tags !== undefined) patch.tags = data.tags;

    if (data.isPublished !== undefined) {
      patch.isPublished = data.isPublished;
      // Only set publishedAt when the post is being published for the first time
      if (data.isPublished && !post.isPublished) {
        patch.publishedAt = new Date();
      }
    }

    await this.blogRepo.update({ id }, patch);

    return this.blogRepo.findOneOrFail({ where: { id } });
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
  async toggleLike(postId: string, _userId: string, increment: boolean): Promise<number> {
    const post = await this.blogRepo.findOne({ where: { id: postId, isPublished: true } });

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

    const updated = await this.blogRepo.findOneOrFail({ where: { id: postId } });
    return updated.likeCount ?? 0;
  }
}
