import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Replaces the boolean `is_published` column on `blog_posts` with a
 * text `status` column that supports DRAFT | PUBLISHED | ARCHIVED states.
 *
 * Up:
 *   1. Add `status text NOT NULL DEFAULT 'draft'`
 *   2. Backfill from is_published
 *   3. Drop is_published and its index
 *   4. Create index on status
 *
 * Down: reverses all steps.
 */
export class BlogPostStatusEnum1775571000000 implements MigrationInterface {
  name = 'BlogPostStatusEnum1775571000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add the new status column (defaults to 'draft' for safety)
    await queryRunner.query(
      `ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'draft'`,
    );

    // 2. Backfill: rows that were published get PUBLISHED, everything else stays DRAFT
    await queryRunner.query(
      `UPDATE "blog_posts" SET "status" = 'published' WHERE "is_published" = true`,
    );
    await queryRunner.query(
      `UPDATE "blog_posts" SET "status" = 'draft' WHERE "is_published" IS NULL OR "is_published" = false`,
    );

    // 3. Drop the old index on is_published (ignore if it does not exist)
    await queryRunner.query(
      `DROP INDEX IF EXISTS "blog_posts_is_published_idx"`,
    );

    // 4. Drop the old column
    await queryRunner.query(
      `ALTER TABLE "blog_posts" DROP COLUMN IF EXISTS "is_published"`,
    );

    // 5. Create index on status for fast filtering
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "blog_posts_status_idx" ON "blog_posts" ("status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop the new index
    await queryRunner.query(`DROP INDEX IF EXISTS "blog_posts_status_idx"`);

    // 2. Re-add is_published column
    await queryRunner.query(
      `ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "is_published" boolean DEFAULT false`,
    );

    // 3. Backfill is_published from status
    await queryRunner.query(
      `UPDATE "blog_posts" SET "is_published" = true WHERE "status" = 'published'`,
    );
    await queryRunner.query(
      `UPDATE "blog_posts" SET "is_published" = false WHERE "status" != 'published'`,
    );

    // 4. Recreate the old index
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "blog_posts_is_published_idx" ON "blog_posts" ("is_published")`,
    );

    // 5. Drop the status column
    await queryRunner.query(
      `ALTER TABLE "blog_posts" DROP COLUMN IF EXISTS "status"`,
    );
  }
}
