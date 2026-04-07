import { DataSource } from 'typeorm';
import 'dotenv/config';

/**
 * TypeORM DataSource used by the CLI (migrations:generate, migrations:run).
 * The NestJS app uses TypeOrmModule.forRoot() in app.module.ts which shares
 * the same configuration but receives entities as imported classes.
 */
export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  schema: process.env.DB_SCHEMA ?? 'spirala_dev_schema',
  entities: [__dirname + '/../db/entities/*.{ts,js}'],
  migrations: [__dirname + '/../db/migrations/*.{ts,js}'],
  ssl: { rejectUnauthorized: false },
  extra: {
    ssl: { rejectUnauthorized: false },
  },
  logging: process.env.NODE_ENV === 'development',
});
