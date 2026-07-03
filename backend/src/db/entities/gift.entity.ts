import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'gifts' })
@Index('gifts_redeem_code_idx', ['redeemCode'])
@Index('gifts_recipient_email_idx', ['recipientEmail'])
export class GiftEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId: string | null;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId: string | null;

  @Column({ name: 'sender_name', type: 'text', nullable: true })
  senderName: string | null;

  @Column({ name: 'recipient_email', type: 'text' })
  recipientEmail: string;

  @Column({ name: 'recipient_name', type: 'text', nullable: true })
  recipientName: string | null;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Column({ name: 'redeem_code', type: 'text', unique: true })
  redeemCode: string;

  @Column({
    name: 'is_redeemed',
    type: 'boolean',
    default: false,
    nullable: true,
  })
  isRedeemed: boolean | null;

  @Column({ name: 'redeemed_by', type: 'uuid', nullable: true })
  redeemedBy: string | null;

  @Column({ name: 'redeemed_at', type: 'timestamptz', nullable: true })
  redeemedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: true })
  createdAt: Date | null;
}
