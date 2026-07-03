import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'contact_messages' })
export class ContactMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'full_name', type: 'text' })
  fullName: string;

  @Column({ type: 'text' })
  email: string;

  @Column({ type: 'text', nullable: true })
  phone: string | null;

  @Column({ type: 'text', nullable: true })
  subject: string | null;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'is_read', type: 'boolean', default: false, nullable: true })
  isRead: boolean | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: true })
  createdAt: Date | null;
}
