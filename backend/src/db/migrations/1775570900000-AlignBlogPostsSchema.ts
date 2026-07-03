import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Aligns `blog_posts` with BlogPostEntity:
 *   - Adds `view_count` and `like_count` counters (default 0)
 *   - Converts `tags` from `text` to `text[]`
 *
 * The initial schema predated the counters and stored tags as a scalar text
 * column, which broke inserts with array values.
 */
export class AlignBlogPostsSchema1775570900000 implements MigrationInterface {
  name = 'AlignBlogPostsSchema1775570900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "view_count" integer DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "like_count" integer DEFAULT 0`,
    );

    // Convert tags: text -> text[]. Existing scalar values become single-element arrays.
    await queryRunner.query(`
      DO $$
      DECLARE
        col_type text;
      BEGIN
        SELECT data_type INTO col_type
        FROM information_schema.columns
        WHERE table_name = 'blog_posts' AND column_name = 'tags';

        IF col_type = 'text' THEN
          ALTER TABLE "blog_posts"
          ALTER COLUMN "tags" TYPE text[]
          USING CASE
            WHEN "tags" IS NULL OR "tags" = '' THEN NULL
            ELSE ARRAY["tags"]
          END;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "blog_posts" ALTER COLUMN "tags" TYPE text USING array_to_string("tags", ',')`,
    );
    await queryRunner.query(
      `ALTER TABLE "blog_posts" DROP COLUMN IF EXISTS "like_count"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blog_posts" DROP COLUMN IF EXISTS "view_count"`,
    );
  }
}
