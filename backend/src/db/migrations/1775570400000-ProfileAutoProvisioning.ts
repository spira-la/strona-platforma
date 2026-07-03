import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Auto-provisions a `profiles` row whenever a new user is created in
 * Supabase `auth.users`. Backfills existing users and, when the
 * `ADMIN_EMAIL` environment variable is set, promotes that user to admin.
 *
 * Without this, the RolesGuard rejects every authenticated request with
 * 403 "User profile not found".
 */
export class ProfileAutoProvisioning1775570400000 implements MigrationInterface {
  name = 'ProfileAutoProvisioning1775570400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check whether the Supabase `auth` schema exists. Locally (plain
    // Postgres) it does not, so we skip the trigger & backfill and the
    // migration becomes a no-op. In Supabase (dev/prod) it will run.
    const authSchema = (await queryRunner.query(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth'
       ) AS exists`,
    )) as Array<{ exists: boolean }>;
    const hasAuthSchema = authSchema[0]?.exists === true;

    if (hasAuthSchema) {
      // 1. Function invoked by the trigger. SECURITY DEFINER so it can
      //    insert into public.profiles regardless of the caller's role.
      await queryRunner.query(`
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS trigger
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $$
        BEGIN
          INSERT INTO public.profiles (id, email, full_name, role)
          VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
            'user'
          )
          ON CONFLICT (id) DO NOTHING;
          RETURN NEW;
        END;
        $$;
      `);

      // 2. Trigger: fires after each insert on auth.users
      await queryRunner.query(
        `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users`,
      );
      await queryRunner.query(`
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
      `);

      // 3. Backfill: insert a profile for every existing auth.users row
      //    that has no matching profile. Default role is 'user'.
      await queryRunner.query(`
        INSERT INTO public.profiles (id, email, full_name, role)
        SELECT
          u.id,
          u.email,
          COALESCE(u.raw_user_meta_data->>'full_name', u.email),
          'user'
        FROM auth.users u
        LEFT JOIN public.profiles p ON p.id = u.id
        WHERE p.id IS NULL;
      `);
    }

    // Admin promotion is handled via the `admin_emails` allowlist
    // table (see CreateAdminEmailsTable migration) — no env vars.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const authSchema = (await queryRunner.query(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth'
       ) AS exists`,
    )) as Array<{ exists: boolean }>;
    if (authSchema[0]?.exists === true) {
      await queryRunner.query(
        `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users`,
      );
    }
    await queryRunner.query(`DROP FUNCTION IF EXISTS public.handle_new_user()`);
    // Backfilled profiles are not removed — they may have been
    // modified since creation.
  }
}
