import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds missing `paid_at` column to `orders` table.
 * The entity declares it but the initial migration omitted it,
 * causing the coach dashboard earnings query to fail.
 */
export class AddOrdersPaidAt1775571300000 implements MigrationInterface {
  name = 'AddOrdersPaidAt1775571300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paid_at" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN IF EXISTS "paid_at"`,
    );
  }
}
