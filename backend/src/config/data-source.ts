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
  // For CLI: glob paths pointing to compiled JS in dist/
  entities: ['dist/db/entities/*.js'],
  migrations: ['dist/db/migrations/*.js'],
  ssl: { rejectUnauthorized: false },
  logging: process.env.NODE_ENV === 'development',
});
