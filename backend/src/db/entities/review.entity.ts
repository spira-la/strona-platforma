import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'reviews' })
@Index('reviews_user_id_idx', ['userId'])
@Index('reviews_product_id_idx', ['productId'])
@Index('reviews_coach_id_idx', ['coachId'])
export class ReviewEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId: string | null;

  @Column({ name: 'coach_id', type: 'uuid', nullable: true })
  coachId: string | null;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({ name: 'is_published', type: 'boolean', default: true, nullable: true })
  isPublished: boolean | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: true })
  createdAt: Date | null;
}
