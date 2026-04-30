import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { OrderStatus } from './enums';

@Entity({ name: 'orders' })
@Index('orders_user_id_idx', ['userId'])
@Index('orders_status_idx', ['status'])
@Index('orders_stripe_payment_intent_idx', ['stripePaymentIntentId'])
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'service_id', type: 'uuid', nullable: true })
  serviceId: string | null;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
    nullable: true,
  })
  status: OrderStatus | null;

  @Column({ name: 'amount_cents', type: 'int' })
  amountCents: number;

  @Column({ name: 'tax_cents', type: 'int', default: 0, nullable: true })
  taxCents: number | null;

  @Column({ type: 'text', default: 'PLN', nullable: true })
  currency: string | null;

  @Column({ name: 'stripe_payment_intent_id', type: 'text', nullable: true })
  stripePaymentIntentId: string | null;

  @Column({ name: 'sessions_total', type: 'int' })
  sessionsTotal: number;

  @Column({ name: 'sessions_remaining', type: 'int' })
  sessionsRemaining: number;

  @Column({ name: 'invoice_number', type: 'text', nullable: true })
  invoiceNumber: string | null;

  @Column({ name: 'coupon_id', type: 'uuid', nullable: true })
  couponId: string | null;

  @Column({ name: 'discount_cents', type: 'int', default: 0, nullable: true })
  discountCents: number | null;

  @Column({ name: 'coach_id', type: 'uuid', nullable: true })
  coachId: string | null;

  @Column({ name: 'customer_email', type: 'text', nullable: true })
  customerEmail: string | null;

  @Column({ name: 'customer_name', type: 'text', nullable: true })
  customerName: string | null;

  @Column({ name: 'customer_phone', type: 'text', nullable: true })
  customerPhone: string | null;

  @Column({ name: 'invoice_data', type: 'jsonb', nullable: true })
  invoiceData: {
    companyName?: string;
    taxId?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  } | null;

  @Column({ name: 'booking_slots', type: 'jsonb', nullable: true })
  bookingSlots: Array<{ startTime: string; endTime: string }> | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: true })
  createdAt: Date | null;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date | null;
}
