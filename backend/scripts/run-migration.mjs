import postgres from 'postgres';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

const migrationFile = resolve(__dirname, '../drizzle/0000_busy_lilandra.sql');
const migrationSql = readFileSync(migrationFile, 'utf-8');

// Split by Drizzle's statement breakpoint marker
const statements = migrationSql
  .split('--> statement-breakpoint')
  .map(s => s.trim())
  .filter(Boolean)
  .filter(s => !s.startsWith('CREATE SCHEMA'));

console.log(`Running ${statements.length} statements...`);

let i = 0;
for (const stmt of statements) {
  i++;
  try {
    await sql.unsafe(stmt);
    process.stdout.write(`  [${i}/${statements.length}] OK\n`);
  } catch (e) {
    console.error(`  [${i}/${statements.length}] FAILED: ${e.message}`);
    console.error(`  Statement: ${stmt.substring(0, 80)}...`);
    await sql.end();
    process.exit(1);
  }
}

console.log('\nAll migrations applied successfully!');
await sql.end();
