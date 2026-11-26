import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/**
 * Full snapshot of the `cms_content` JSONB document, taken before any
 * destructive bulk operation (reset-sections, restore-backup).
 */
@Entity({ name: 'cms_content_backups' })
export class CmsContentBackupEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'jsonb' })
  content: Record<string, unknown>;

  @Column({ type: 'text' })
  reason: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;
}
