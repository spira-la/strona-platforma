import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'slot_holds' })
@Index('slot_holds_coach_start_idx', ['coachId', 'startTime'])
@Index('slot_holds_expires_idx', ['expiresAt'])
@Index('slot_holds_order_idx', ['orderId'])
export class SlotHoldEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'coach_id', type: 'uuid' })
  coachId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'start_time', type: 'timestamptz' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamptz' })
  endTime: Date;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: true })
  createdAt: Date | null;
}
