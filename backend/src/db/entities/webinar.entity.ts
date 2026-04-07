import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { WebinarStatus, WebinarSessionStatus } from './enums';

@Entity({ name: 'webinars' })
@Index('webinars_slug_idx', ['slug'])
@Index('webinars_status_idx', ['status'])
export class WebinarEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', unique: true, nullable: true })
  slug: string | null;

  @Column({ name: 'host_id', type: 'uuid', nullable: true })
  hostId: string | null;

  @Column({ name: 'shadow_host_id', type: 'uuid', nullable: true })
  shadowHostId: string | null;

  @Column({ name: 'admin_speaker_ids', type: 'uuid', array: true, nullable: true })
  adminSpeakerIds: string[] | null;

  @Column({
    type: 'enum',
    enum: WebinarStatus,
    default: WebinarStatus.DRAFT,
    nullable: true,
  })
  status: WebinarStatus | null;

  @Column({ name: 'max_participants', type: 'int', nullable: true })
  maxParticipants: number | null;

  @Column({ name: 'registered_count', type: 'int', default: 0, nullable: true })
  registeredCount: number | null;

  @Column({ type: 'text', nullable: true })
  language: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: true })
  createdAt: Date | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', nullable: true })
  updatedAt: Date | null;
}

@Entity({ name: 'webinar_sessions' })
@Index('webinar_sessions_webinar_id_idx', ['webinarId'])
export class WebinarSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'webinar_id', type: 'uuid', nullable: true })
  webinarId: string | null;

  @Column({ name: 'session_number', type: 'int', nullable: true })
  sessionNumber: number | null;

  @Column({ name: 'start_time', type: 'timestamptz' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamptz' })
  endTime: Date;

  @Column({
    type: 'enum',
    enum: WebinarSessionStatus,
    default: WebinarSessionStatus.SCHEDULED,
    nullable: true,
  })
  status: WebinarSessionStatus | null;

  @Column({ name: 'livekit_room_name', type: 'text', nullable: true })
  livekitRoomName: string | null;

  @Column({ name: 'recording_url', type: 'text', nullable: true })
  recordingUrl: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: true })
  createdAt: Date | null;
}

@Entity({ name: 'webinar_registrations' })
@Unique('webinar_registrations_unique', ['webinarId', 'userId'])
@Index('webinar_registrations_webinar_id_idx', ['webinarId'])
@Index('webinar_registrations_user_id_idx', ['userId'])
export class WebinarRegistrationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'webinar_id', type: 'uuid', nullable: true })
  webinarId: string | null;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @CreateDateColumn({ name: 'registered_at', type: 'timestamptz', nullable: true })
  registeredAt: Date | null;
}
