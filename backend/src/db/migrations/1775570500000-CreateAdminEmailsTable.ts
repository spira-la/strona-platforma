import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Email allowlist that grants admin access. Any authenticated Supabase
 * user whose email appears in this table is treated as an admin by
 * RolesGuard (mirrors the `users_admin` collection from BeWonderMe).
 *
 * Admins are managed entirely from the DB (insert/delete rows) or
 * through the future admin panel CRUD — no env vars involved.
 */
export class CreateAdminEmailsTable1775570500000 implements MigrationInterface {
  name = 'CreateAdminEmailsTable1775570500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admin_emails" (
        "id"         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
        "email"      text        NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_admin_emails_email_lower"
        ON "admin_emails" (lower("email"));
    `);

    // Seed: primary admin for Spirala.
    await queryRunner.query(`
      INSERT INTO "admin_emails" ("email") VALUES ('admin@spira-la.com')
      ON CONFLICT DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_admin_emails_email_lower"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_emails"`);
  }
}
