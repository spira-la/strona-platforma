import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  schemaFilter: [process.env.DB_SCHEMA || 'spirala_dev_schema'],
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
