import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { BlogPostEntity } from './blog.entity.js';

@Entity({ name: 'blog_post_translations' })
@Index('blog_post_translations_post_idx', ['postId'])
@Unique('UQ_blog_post_translations_post_lang', ['postId', 'languageCode'])
export class BlogPostTranslationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'post_id', type: 'uuid' })
  postId: string;

  @ManyToOne(() => BlogPostEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: BlogPostEntity;

  @Column({ name: 'language_code', type: 'text' })
  languageCode: string;

  @Column({ type: 'text', nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({ type: 'text', nullable: true })
  excerpt: string | null;

  @Column({ name: 'is_auto_translated', type: 'boolean', default: true })
  isAutoTranslated: boolean;

  @Column({ name: 'translated_at', type: 'timestamptz', nullable: true })
  translatedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: true })
  createdAt: Date | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', nullable: true })
  updatedAt: Date | null;
}
