import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'blog_posts' })
@Index('blog_posts_slug_idx', ['slug'])
@Index('blog_posts_is_published_idx', ['isPublished'])
@Index('blog_posts_published_at_idx', ['publishedAt'])
export class BlogPostEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'author_id', type: 'uuid', nullable: true })
  authorId: string | null;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({ type: 'text', nullable: true })
  excerpt: string | null;

  @Column({ name: 'cover_image_url', type: 'text', nullable: true })
  coverImageUrl: string | null;

  @Column({ name: 'is_published', type: 'boolean', default: false, nullable: true })
  isPublished: boolean | null;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @Column({ type: 'text', array: true, nullable: true })
  tags: string[] | null;

  @Column({ name: 'view_count', type: 'int', default: 0, nullable: true })
  viewCount: number | null;

  @Column({ name: 'like_count', type: 'int', default: 0, nullable: true })
  likeCount: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: true })
  createdAt: Date | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', nullable: true })
  updatedAt: Date | null;
}

@Entity({ name: 'blog_comments' })
@Index('blog_comments_post_id_idx', ['postId'])
export class BlogCommentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'post_id', type: 'uuid', nullable: true })
  postId: string | null;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'is_approved', type: 'boolean', default: false, nullable: true })
  isApproved: boolean | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: true })
  createdAt: Date | null;
}
