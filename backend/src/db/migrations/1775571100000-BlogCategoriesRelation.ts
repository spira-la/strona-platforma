import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Replace free-text `tags` on blog_posts with a many-to-many relation to
 * the categories table. Also adds i18n columns (name_en, name_es) to
 * categories so category names can be displayed in all 3 system languages.
 */
export class BlogCategoriesRelation1775571100000 implements MigrationInterface {
  name = 'BlogCategoriesRelation1775571100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add i18n columns to categories
    await queryRunner.query(
      `ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "name_en" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "name_es" text`,
    );

    // 2. Create join table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "blog_post_categories" (
        "post_id" uuid NOT NULL,
        "category_id" uuid NOT NULL,
        CONSTRAINT "PK_blog_post_categories" PRIMARY KEY ("post_id", "category_id"),
        CONSTRAINT "FK_blog_post_categories_post" FOREIGN KEY ("post_id")
          REFERENCES "blog_posts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_blog_post_categories_category" FOREIGN KEY ("category_id")
          REFERENCES "categories"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "blog_post_categories_category_idx" ON "blog_post_categories"("category_id")`,
    );

    // 3. Drop old tags column
    await queryRunner.query(
      `ALTER TABLE "blog_posts" DROP COLUMN IF EXISTS "tags"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add tags column
    await queryRunner.query(
      `ALTER TABLE "blog_posts" ADD COLUMN "tags" text[]`,
    );

    // Drop join table
    await queryRunner.query(
      `DROP TABLE IF EXISTS "blog_post_categories" CASCADE`,
    );

    // Drop i18n columns
    await queryRunner.query(
      `ALTER TABLE "categories" DROP COLUMN IF EXISTS "name_es"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP COLUMN IF EXISTS "name_en"`,
    );
  }
}
