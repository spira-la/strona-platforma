import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/**
 * Mirror of the `feature_flags` table created by InitialSchema.
 * Each row gates a backend feature; `name` is the identifier that
 * matches the keys in the frontend's `featureFlags` config and the
 * argument of the `@FeatureFlag()` decorator.
 */
@Entity({ name: 'feature_flags' })
export class FeatureFlagEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  name: string;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
