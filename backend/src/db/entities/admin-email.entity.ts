import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'admin_emails' })
export class AdminEmailEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  email: string;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;
}
