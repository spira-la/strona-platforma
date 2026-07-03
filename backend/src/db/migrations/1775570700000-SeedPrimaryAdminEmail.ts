import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeds the primary admin email (`admin@spira-la.com`) into the
 * `admin_emails` allowlist. A dedicated migration because the original
 * `CreateAdminEmailsTable` was already applied on several environments
 * before the seed statement was added — migrations only run once per
 * DB, so a new file is the only way to reach those installs.
 *
 * Safe to re-run: the insert is idempotent via `ON CONFLICT`.
 */
export class SeedPrimaryAdminEmail1775570700000 implements MigrationInterface {
  name = 'SeedPrimaryAdminEmail1775570700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "admin_emails" ("email")
      VALUES ('admin@spira-la.com')
      ON CONFLICT DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "admin_emails" WHERE lower("email") = 'admin@spira-la.com'`,
    );
  }
}
