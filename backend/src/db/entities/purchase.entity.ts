import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { PurchaseStatus } from './enums.js';

@Entity({ name: 'purchases' })
@Unique('purchases_user_product_unique', ['userId', 'productId'])
@Index('purchases_user_id_idx', ['userId'])
@Index('purchases_product_id_idx', ['productId'])
export class PurchaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId: string | null;

  @Column({
    type: 'enum',
    enum: PurchaseStatus,
    default: PurchaseStatus.ACTIVE,
    nullable: true,
  })
  status: PurchaseStatus | null;

  @CreateDateColumn({ name: 'purchased_at', type: 'timestamptz', nullable: true })
  purchasedAt: Date | null;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date | null;
}

@Entity({ name: 'user_progress' })
@Unique('user_progress_user_product_unique', ['userId', 'productId'])
@Index('user_progress_user_id_idx', ['userId'])
export class UserProgressEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({
    name: 'progress_percent',
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: '0',
    nullable: true,
  })
  progressPercent: string | null;

  @Column({ name: 'current_position_seconds', type: 'int', nullable: true })
  currentPositionSeconds: number | null;

  @Column({ name: 'current_page', type: 'int', nullable: true })
  currentPage: number | null;

  @Column({ name: 'chapters_completed', type: 'uuid', array: true, nullable: true })
  chaptersCompleted: string[] | null;

  @Column({ name: 'is_completed', type: 'boolean', default: false, nullable: true })
  isCompleted: boolean | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'last_accessed_at', type: 'timestamptz', nullable: true })
  lastAccessedAt: Date | null;

  @Column({ name: 'time_spent_minutes', type: 'int', default: 0, nullable: true })
  timeSpentMinutes: number | null;
}
