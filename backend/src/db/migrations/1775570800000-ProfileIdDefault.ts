import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds `DEFAULT gen_random_uuid()` to `profiles.id` so the column
 * always has a value when an insert omits it. Supabase's auth trigger
 * still passes the explicit `auth.users.id`, which overrides the
 * default — this only kicks in for app-side inserts (e.g. coaches
 * created via the admin panel before the user has signed up).
 */
export class ProfileIdDefault1775570800000 implements MigrationInterface {
  name = 'ProfileIdDefault1775570800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(
      `ALTER TABLE "profiles" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "profiles" ALTER COLUMN "id" DROP DEFAULT`,
    );
  }
}
