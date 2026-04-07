import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment-specific file first, then fall back to .env
config({ path: '.env.local' });
config({ path: '.env' });

const schema = process.env.DB_SCHEMA ?? 'spirala_dev_schema';

/**
 * TypeORM DataSource used by the CLI (migrations:generate, migrations:run).
 * The NestJS app uses TypeOrmModule.forRoot() in app.module.ts which shares
 * the same configuration but receives entities as imported classes.
 *
 * Key points:
 * - uuidExtension: 'pgcrypto' => uses gen_random_uuid() (built into PG 13+)
 * - schema: from DB_SCHEMA env var => migrations are schema-agnostic
 * - search_path includes 'public' for extensions accessibility
 */
export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  schema,
  entities: [__dirname + '/../db/entities/*.{ts,js}'],
  migrations: [__dirname + '/../db/migrations/*.{ts,js}'],
  uuidExtension: 'pgcrypto',
  ssl: { rejectUnauthorized: false },
  extra: {
    ssl: { rejectUnauthorized: false },
    options: `-c search_path=${schema},public`,
  },
  logging: process.env.NODE_ENV === 'development',
});
