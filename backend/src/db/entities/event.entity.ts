import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

/**
 * Events (workshops, meetings, webinars) that the coach adds herself from the
 * admin panel (2026-11 redesign, page /wydarzenia). Sign-up is a simple e-mail
 * form — no payment; any price is just a label and is settled by e-mail.
 *
 * Kept separate from the hidden `webinars` tables (LiveKit hosts, sessions,
 * paid registrations), which stay untouched for a future reactivation.
 */
@Entity({ name: 'events' })
@Index('events_starts_at_idx', ['startsAt'])
@Index('events_published_idx', ['isPublished'])
export class EventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt: Date;

  @Column({ name: 'ends_at', type: 'timestamptz', nullable: true })
  endsAt: Date | null;

  /** Free text: city / address, or the platform for online events. */
  @Column({ type: 'text', nullable: true })
  location: string | null;

  @Column({ name: 'is_online', type: 'boolean', default: false })
  isOnline: boolean;

  /** Free text shown as is, e.g. "150 zł" or "Bezpłatne". */
  @Column({ name: 'price_label', type: 'text', nullable: true })
  priceLabel: string | null;

  /** Max participants; null = no limit. */
  @Column({ type: 'int', nullable: true })
  capacity: number | null;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string | null;

  /** Only published events are visible on /wydarzenia. */
  @Column({ name: 'is_published', type: 'boolean', default: false })
  isPublished: boolean;

  /** The coach can close sign-ups without hiding the event. */
  @Column({ name: 'registration_open', type: 'boolean', default: true })
  registrationOpen: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

@Entity({ name: 'event_registrations' })
@Index('event_registrations_event_id_idx', ['eventId'])
@Index('event_registrations_event_email_uq', ['eventId', 'email'], {
  unique: true,
})
export class EventRegistrationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id', type: 'uuid' })
  eventId: string;

  @ManyToOne(() => EventEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event?: EventEntity;

  @Column({ name: 'full_name', type: 'text' })
  fullName: string;

  /** Stored lower-cased so the (event, email) unique index blocks duplicates. */
  @Column({ type: 'text' })
  email: string;

  @Column({ type: 'text', nullable: true })
  phone: string | null;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
