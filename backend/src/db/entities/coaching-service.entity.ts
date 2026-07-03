import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'coaching_services' })
export class CoachingServiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('coaching_services_coach_id_idx')
  @Column({ name: 'coach_id', type: 'uuid', nullable: true })
  coachId: string | null;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'duration_minutes', type: 'int' })
  durationMinutes: number;

  @Column({ name: 'session_count', type: 'int', default: 1, nullable: true })
  sessionCount: number | null;

  @Column({ name: 'price_cents', type: 'int' })
  priceCents: number;

  @Column({ type: 'text', default: 'PLN', nullable: true })
  currency: string | null;

  @Column({ name: 'stripe_product_id', type: 'text', nullable: true })
  stripeProductId: string | null;

  @Column({ name: 'stripe_price_id', type: 'text', nullable: true })
  stripePriceId: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true, nullable: true })
  isActive: boolean | null;

  @Column({ name: 'sort_order', type: 'int', default: 0, nullable: true })
  sortOrder: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: true })
  createdAt: Date | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', nullable: true })
  updatedAt: Date | null;
}
