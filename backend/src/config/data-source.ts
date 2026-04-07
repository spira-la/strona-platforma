import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env' });

const schema = process.env.DB_SCHEMA ?? 'spirala_dev_schema';
const useSSL = process.env.DB_SSL === 'true';

/**
 * TypeORM DataSource used by the CLI (migrations:generate, migrations:run).
 *
 * - uuidExtension: 'pgcrypto' => uses gen_random_uuid() (PG 13+ native)
 * - schema: from DB_SCHEMA env var => migrations are schema-agnostic
 * - SSL: only when DB_SSL=true (for Supabase), disabled for local PostgreSQL
 */
export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  schema,
  entities: [__dirname + '/../db/entities/*.{ts,js}'],
  migrations: [__dirname + '/../db/migrations/*.{ts,js}'],
  uuidExtension: 'pgcrypto',
  ...(useSSL ? {
    ssl: { rejectUnauthorized: false },
    extra: { ssl: { rejectUnauthorized: false } },
  } : {}),
  logging: process.env.NODE_ENV === 'development',
});
