import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoriesParentId1775570200000 implements MigrationInterface {
  name = 'AddCategoriesParentId1775570200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "categories"
      ADD COLUMN IF NOT EXISTS "parent_id" uuid
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "categories"
      DROP COLUMN IF EXISTS "parent_id"
    `);
  }
}
