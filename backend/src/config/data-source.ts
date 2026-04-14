import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env' });

const schema = process.env.DATABASE_SCHEMA ?? 'spirala_dev_schema';
const useSSL = process.env.DATABASE_SSL === 'true';

/**
 * TypeORM DataSource for CLI (migration:generate, migration:run).
 *
 * Reads individual DATABASE_* env vars — no monolithic URL.
 * SSL only when DATABASE_SSL=true (e.g. Supabase), off for local PostgreSQL.
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number.parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  schema,
  entities: [__dirname + '/../db/entities/*.{ts,js}'],
  migrations: [__dirname + '/../db/migrations/*.{ts,js}'],
  uuidExtension: 'pgcrypto',
  ...(useSSL
    ? {
        ssl: { rejectUnauthorized: false },
        extra: { ssl: { rejectUnauthorized: false } },
      }
    : {}),
  logging: process.env.NODE_ENV === 'development',
});
