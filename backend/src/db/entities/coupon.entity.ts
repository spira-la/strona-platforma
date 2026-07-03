import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { DiscountType } from './enums';

@Entity({ name: 'coupons' })
@Index('coupons_code_idx', ['code'])
export class CouponEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  code: string;

  @Column({
    name: 'discount_type',
    type: 'enum',
    enum: DiscountType,
    nullable: true,
  })
  discountType: DiscountType | null;

  @Column({ name: 'discount_value', type: 'int' })
  discountValue: number;

  @Column({ name: 'max_uses', type: 'int', nullable: true })
  maxUses: number | null;

  @Column({ name: 'current_uses', type: 'int', default: 0, nullable: true })
  currentUses: number | null;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @Column({ name: 'is_active', type: 'boolean', default: true, nullable: true })
  isActive: boolean | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: true })
  createdAt: Date | null;
}
