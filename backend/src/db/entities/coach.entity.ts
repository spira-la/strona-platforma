import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'coaches' })
export class CoachEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('coaches_user_id_idx')
  @Column({ name: 'user_id', type: 'uuid', nullable: true, unique: true })
  userId: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ type: 'text', array: true, nullable: true })
  expertise: string[] | null;

  @Column({ type: 'text', array: true, nullable: true })
  languages: string[] | null;

  @Column({ type: 'text', nullable: true })
  location: string | null;

  @Column({ type: 'text', nullable: true })
  website: string | null;

  @Column({ type: 'text', default: 'Europe/Warsaw', nullable: true })
  timezone: string | null;

  @Column({ name: 'accepting_clients', type: 'boolean', default: true, nullable: true })
  acceptingClients: boolean | null;

  @Column({ name: 'stripe_connect_id', type: 'text', nullable: true })
  stripeConnectId: string | null;

  @Column({ name: 'years_experience', type: 'int', nullable: true })
  yearsExperience: number | null;

  @Column({ type: 'text', array: true, nullable: true })
  certifications: string[] | null;

  @Column({ name: 'is_active', type: 'boolean', default: true, nullable: true })
  isActive: boolean | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: true })
  createdAt: Date | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', nullable: true })
  updatedAt: Date | null;
}
