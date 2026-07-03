import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add a public `title` (professional subtitle) column to coaches. It backs the
 * author subtitle shown on the blog author card (e.g. "Coach · Spirala") and is
 * editable per coach in the admin, replacing the previously hard-coded string.
 */
export class AddCoachTitle1775571600000 implements MigrationInterface {
  name = 'AddCoachTitle1775571600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "coaches" ADD COLUMN IF NOT EXISTS "title" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "coaches" DROP COLUMN IF EXISTS "title"`,
    );
  }
}
