#!/usr/bin/env bash
# Runs the database tests in supabase/tests/sql against DATABASE_URL.
# Default: the local Supabase database that `supabase db start` runs on port 54322.
# Each test file runs in one transaction, rolls back, and prints "ok - <name>" per check.
set -euo pipefail

url="${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
cd "$(dirname "$0")/.."

status=0
for file in supabase/tests/sql/*.sql; do
  echo "== ${file}"
  # Query results go to /dev/null; the "ok - <name>" notices and any error come through.
  if ! psql "$url" -X -q -v ON_ERROR_STOP=1 -o /dev/null -f "$file" 2>&1 | sed -e 's/^psql:[^ ]* NOTICE:  //'; then
    status=1
  fi
done

if [ "$status" -ne 0 ]; then
  echo "Database tests failed."
else
  echo "Database tests passed."
fi
exit "$status"
