#!/bin/bash
set -e

# =====================================================================
# Spirala — Database initialization script
# Runs once when the PostgreSQL container is first created.
# Creates two databases with separate users and schemas.
# Passwords come from environment variables set in docker-compose.db.yml
# =====================================================================

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL

  -- ─── Dev Database ─────────────────────────────────────────────────
  CREATE USER spirala_dev WITH PASSWORD '${DB_DEV_PASSWORD}';
  CREATE DATABASE spirala_dev OWNER spirala_dev;

  \c spirala_dev;

  CREATE SCHEMA IF NOT EXISTS spirala_dev_schema AUTHORIZATION spirala_dev;
  GRANT ALL PRIVILEGES ON SCHEMA spirala_dev_schema TO spirala_dev;
  ALTER DEFAULT PRIVILEGES IN SCHEMA spirala_dev_schema GRANT ALL ON TABLES TO spirala_dev;
  ALTER DEFAULT PRIVILEGES IN SCHEMA spirala_dev_schema GRANT ALL ON SEQUENCES TO spirala_dev;
  ALTER USER spirala_dev SET search_path TO spirala_dev_schema, public;

  -- ─── Prod Database ────────────────────────────────────────────────
  \c postgres;

  CREATE USER spirala WITH PASSWORD '${DB_PROD_PASSWORD}';
  CREATE DATABASE spirala_prod OWNER spirala;

  \c spirala_prod;

  CREATE SCHEMA IF NOT EXISTS spirala_schema AUTHORIZATION spirala;
  GRANT ALL PRIVILEGES ON SCHEMA spirala_schema TO spirala;
  ALTER DEFAULT PRIVILEGES IN SCHEMA spirala_schema GRANT ALL ON TABLES TO spirala;
  ALTER DEFAULT PRIVILEGES IN SCHEMA spirala_schema GRANT ALL ON SEQUENCES TO spirala;
  ALTER USER spirala SET search_path TO spirala_schema, public;

EOSQL
