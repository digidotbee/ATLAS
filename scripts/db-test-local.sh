#!/usr/bin/env bash
# Runs the database tests on a throwaway plain Postgres, for machines without Docker.
# It applies a small stand-in for Supabase's auth schema (supabase/tests/local/auth_stub.sql),
# then every migration, then scripts/db-test.sh. CI runs the same tests on a real local Supabase.
set -euo pipefail
cd "$(dirname "$0")/.."

bin="${PG_BIN:-}"
if [ -z "$bin" ]; then
  if command -v pg_config >/dev/null 2>&1; then
    bin="$(pg_config --bindir)"
  else
    bin="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -n 1)"
  fi
fi
if [ ! -x "${bin}/initdb" ]; then
  echo "Postgres server binaries not found. Set PG_BIN to the directory with initdb and pg_ctl." >&2
  exit 1
fi

# Postgres refuses to run as root; use the postgres account when there is one.
as_pg=()
if [ "$(id -u)" -eq 0 ]; then
  if id postgres >/dev/null 2>&1; then
    as_pg=(runuser -u postgres --)
  else
    echo "Run as a non-root user, or create a postgres user." >&2
    exit 1
  fi
fi

dir="$(mktemp -d)"
chmod 777 "$dir"
port="${PG_TEST_PORT:-55432}"
stop() {
  "${as_pg[@]}" "${bin}/pg_ctl" -D "${dir}/data" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$dir"
}
trap stop EXIT

"${as_pg[@]}" "${bin}/initdb" -D "${dir}/data" -U postgres --auth=trust -E UTF8 >/dev/null
"${as_pg[@]}" "${bin}/pg_ctl" -D "${dir}/data" -l "${dir}/log" -w \
  -o "-p ${port} -k ${dir} -c listen_addresses=''" start >/dev/null

url="postgresql://postgres@/postgres?host=${dir}&port=${port}"
psql "$url" -X -q -v ON_ERROR_STOP=1 -f supabase/tests/local/auth_stub.sql
for migration in supabase/migrations/*.sql; do
  psql "$url" -X -q -v ON_ERROR_STOP=1 -f "$migration"
done

DATABASE_URL="$url" bash scripts/db-test.sh
