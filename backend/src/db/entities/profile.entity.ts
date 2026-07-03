import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from './enums';

@Entity({ name: 'profiles' })
export class ProfileEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ name: 'full_name', type: 'text', nullable: true })
  fullName: string | null;

  @Column({ type: 'text', unique: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  phone: string | null;

  @Column({ type: 'text', default: 'Europe/Warsaw', nullable: true })
  timezone: string | null;

  @Column({ type: 'text', default: 'pl', nullable: true })
  locale: string | null;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
    nullable: true,
  })
  role: UserRole | null;

  @Column({ type: 'boolean', default: false, nullable: true })
  disabled: boolean | null;

  @Column({ name: 'disabled_reason', type: 'text', nullable: true })
  disabledReason: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: true })
  createdAt: Date | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', nullable: true })
  updatedAt: Date | null;
}
