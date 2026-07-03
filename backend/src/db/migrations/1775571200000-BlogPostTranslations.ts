import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the blog_post_translations table for storing auto-translated
 * blog post content in multiple languages (pl, en, es).
 */
export class BlogPostTranslations1775571200000 implements MigrationInterface {
  name = 'BlogPostTranslations1775571200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "blog_post_translations" (
        "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "post_id" uuid NOT NULL,
        "language_code" text NOT NULL,
        "title" text,
        "content" text,
        "excerpt" text,
        "is_auto_translated" boolean DEFAULT true,
        "translated_at" timestamptz DEFAULT now(),
        "created_at" timestamptz DEFAULT now(),
        "updated_at" timestamptz DEFAULT now(),
        CONSTRAINT "FK_blog_post_translations_post" FOREIGN KEY ("post_id")
          REFERENCES "blog_posts"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_blog_post_translations_post_lang" UNIQUE ("post_id", "language_code")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "blog_post_translations_post_idx" ON "blog_post_translations"("post_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "blog_post_translations" CASCADE`,
    );
  }
}
