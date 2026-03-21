#!/usr/bin/env bash
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'sales') THEN
    RAISE EXCEPTION 'sales table not found';
  END IF;
END $$;
SQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c \
  "COPY sales (sale_date, outlet, dish, quantity, channel) FROM '/data/sales.csv' WITH (FORMAT csv, HEADER true);"

