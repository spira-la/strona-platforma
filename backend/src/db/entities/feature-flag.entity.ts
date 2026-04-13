import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'feature_flags' })
export class FeatureFlagEntity {
  @PrimaryColumn({ type: 'text' })
  key: string;

  @Column({ type: 'boolean', default: false, nullable: true })
  enabled: boolean | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', nullable: true })
  updatedAt: Date | null;
}
