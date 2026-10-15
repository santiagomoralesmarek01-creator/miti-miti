#!/usr/bin/env bash
# Crea una base descartable, aplica las migraciones y corre los tests de permisos.
# Usa las variables estándar de Postgres (PGHOST, PGUSER, PGPASSWORD, PGPORT).
set -euo pipefail
cd "$(dirname "$0")/.."
DB="miti_miti_test_$$"
psql -q -d postgres -c "create database $DB"
trap 'psql -q -d postgres -c "drop database if exists $DB" >/dev/null' EXIT
run() { psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$1"; }
run supabase/tests/00-simular-supabase.sql
for f in supabase/migrations/*.sql; do run "$f"; done
psql -X -q -t -A -v ON_ERROR_STOP=1 -d "$DB" -f supabase/tests/permisos.test.sql -o /dev/null 2>&1 | sed 's/^psql:.*NOTICE:  /  /'
