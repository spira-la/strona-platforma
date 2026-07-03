import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'languages' })
export class LanguageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  code: string; // e.g. 'pl', 'en', 'es'

  @Column({ type: 'text' })
  name: string; // e.g. 'Polish', 'English', 'Spanish'

  @Column({ name: 'native_name', type: 'text', nullable: true })
  nativeName: string | null; // e.g. 'Polski', 'English', 'Español'

  @Column({ type: 'text', nullable: true })
  flag: string | null; // emoji flag e.g. '🇵🇱'

  @Column({ name: 'sort_order', type: 'int', default: 0, nullable: true })
  sortOrder: number | null;

  @Column({ name: 'is_active', type: 'boolean', default: true, nullable: true })
  isActive: boolean | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: true })
  createdAt: Date | null;
}
