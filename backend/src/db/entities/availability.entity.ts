import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity({ name: 'availability' })
export class AvailabilityEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('availability_coach_id_idx')
  @Column({ name: 'coach_id', type: 'uuid', nullable: true })
  coachId: string | null;

  @Column({ name: 'day_of_week', type: 'int', nullable: true })
  dayOfWeek: number | null;

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime: string;

  @Column({ name: 'is_active', type: 'boolean', default: true, nullable: true })
  isActive: boolean | null;
}

@Entity({ name: 'availability_blocks' })
export class AvailabilityBlockEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('availability_blocks_coach_id_idx')
  @Column({ name: 'coach_id', type: 'uuid', nullable: true })
  coachId: string | null;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({ type: 'text', nullable: true })
  reason: string | null;
}
