import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { SubscriberStatus } from './enums.js';

@Entity({ name: 'newsletter_subscribers' })
@Index('newsletter_subscribers_email_idx', ['email'])
@Index('newsletter_subscribers_coach_id_idx', ['coachId'])
export class NewsletterSubscriberEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  email: string;

  @Column({ name: 'coach_id', type: 'uuid', nullable: true })
  coachId: string | null;

  @Column({
    type: 'enum',
    enum: SubscriberStatus,
    default: SubscriberStatus.ACTIVE,
    nullable: true,
  })
  status: SubscriberStatus | null;

  @Column({ name: 'unsubscribe_token', type: 'text', unique: true, nullable: true })
  unsubscribeToken: string | null;

  @CreateDateColumn({ name: 'subscribed_at', type: 'timestamptz', nullable: true })
  subscribedAt: Date | null;

  @Column({ name: 'unsubscribed_at', type: 'timestamptz', nullable: true })
  unsubscribedAt: Date | null;
}
