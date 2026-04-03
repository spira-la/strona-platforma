import { pgSchema } from 'drizzle-orm/pg-core';

export const spiralaSchema = pgSchema(
  process.env.DB_SCHEMA || 'spirala_dev_schema',
);
