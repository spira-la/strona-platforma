import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { BookingStatus } from './enums';

@Entity({ name: 'bookings' })
@Index('bookings_coach_id_idx', ['coachId'])
@Index('bookings_user_id_idx', ['userId'])
@Index('bookings_start_time_idx', ['startTime'])
@Index('bookings_status_idx', ['status'])
export class BookingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId: string | null;

  @Column({ name: 'coach_id', type: 'uuid' })
  coachId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'start_time', type: 'timestamptz' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamptz' })
  endTime: Date;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.CONFIRMED,
    nullable: true,
  })
  status: BookingStatus | null;

  @Column({ name: 'meeting_link', type: 'text', nullable: true })
  meetingLink: string | null;

  @Column({ name: 'livekit_room_name', type: 'text', nullable: true })
  livekitRoomName: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string | null;

  @Column({ name: 'rescheduled_at', type: 'timestamptz', nullable: true })
  rescheduledAt: Date | null;

  @Column({ name: 'rescheduled_from', type: 'timestamptz', nullable: true })
  rescheduledFrom: Date | null;

  @Column({ name: 'reschedule_reason', type: 'text', nullable: true })
  rescheduleReason: string | null;

  @Column({ name: 'reschedule_count', type: 'int', default: 0, nullable: true })
  rescheduleCount: number | null;

  @Column({ name: 'service_id', type: 'uuid', nullable: true })
  serviceId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: true })
  createdAt: Date | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', nullable: true })
  updatedAt: Date | null;
}
