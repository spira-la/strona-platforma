import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeds the feature_flags table with the canonical set of flags used
 * by the Spirala backend guards. The list mirrors frontend/src/config/
 * features.ts — keep them in sync when adding a flag on either side.
 *
 * Idempotent: ON CONFLICT DO NOTHING means re-running this migration
 * (or running it after manual inserts) is safe. If you want to flip a
 * flag at runtime, UPDATE the `enabled` column directly — do not edit
 * this migration.
 */
const FLAGS: Array<{ name: string; enabled: boolean; description: string }> = [
  // — active for the public Spirala launch —
  {
    name: 'booking',
    enabled: true,
    description: 'Session booking UI and BE endpoints.',
  },
  { name: 'packages', enabled: true, description: 'Multi-session packages.' },
  { name: 'blog', enabled: true, description: 'Public blog.' },
  {
    name: 'newsletter',
    enabled: true,
    description: 'Newsletter subscription.',
  },
  { name: 'seoManagement', enabled: true, description: 'SEO admin panel.' },
  {
    name: 'youtubeContent',
    enabled: true,
    description: 'YouTube channel videos page + section.',
  },
  // — preserved for future activation —
  {
    name: 'multiCoach',
    enabled: false,
    description: 'Multi-coach marketplace.',
  },
  {
    name: 'webinars',
    enabled: false,
    description: 'Live webinars + LiveKit studio.',
  },
  {
    name: 'audioCourses',
    enabled: false,
    description: 'Audio courses player.',
  },
  { name: 'ebooks', enabled: false, description: 'Ebook reader.' },
  { name: 'giftPurchases', enabled: false, description: 'Gift purchase flow.' },
  {
    name: 'stripeConnect',
    enabled: false,
    description: 'Coach payouts via Stripe Connect.',
  },
  { name: 'reviews', enabled: false, description: 'Product reviews.' },
  {
    name: 'multiCurrency',
    enabled: false,
    description: 'Multiple currencies in checkout.',
  },
  {
    name: 'purchaseFlow',
    enabled: false,
    description: 'End-to-end purchase / cart / checkout.',
  },
];

export class SeedFeatureFlags1775571500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const flag of FLAGS) {
      await queryRunner.query(
        `INSERT INTO "feature_flags" ("name", "enabled", "description")
         VALUES ($1, $2, $3)
         ON CONFLICT ("name") DO NOTHING`,
        [flag.name, flag.enabled, flag.description],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const names = FLAGS.map((f) => f.name);
    await queryRunner.query(
      `DELETE FROM "feature_flags" WHERE "name" = ANY($1)`,
      [names],
    );
  }
}
