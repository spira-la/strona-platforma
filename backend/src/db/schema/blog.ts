import {
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { profiles } from './profiles.js';
import { spiralaSchema } from './pg-schema.js';

export const blogPosts = spiralaSchema.table(
  'blog_posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    authorId: uuid('author_id').references(() => profiles.id),
    title: text('title').notNull(),
    slug: text('slug').unique().notNull(),
    content: jsonb('content').notNull(),
    excerpt: text('excerpt'),
    coverImageUrl: text('cover_image_url'),
    isPublished: boolean('is_published').default(false),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    tags: text('tags').array(),
    viewCount: integer('view_count').default(0),
    likeCount: integer('like_count').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('blog_posts_slug_idx').on(table.slug),
    index('blog_posts_is_published_idx').on(table.isPublished),
    index('blog_posts_published_at_idx').on(table.publishedAt),
  ],
);

export const blogComments = spiralaSchema.table(
  'blog_comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: uuid('post_id').references(() => blogPosts.id, {
      onDelete: 'cascade',
    }),
    userId: uuid('user_id').references(() => profiles.id),
    content: text('content').notNull(),
    isApproved: boolean('is_approved').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('blog_comments_post_id_idx').on(table.postId)],
);

export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;
export type BlogComment = typeof blogComments.$inferSelect;
export type NewBlogComment = typeof blogComments.$inferInsert;
