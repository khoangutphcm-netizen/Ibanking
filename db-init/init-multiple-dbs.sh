#!/bin/bash
set -e
for DB in account_db tuition_db payment_db otp_db; do
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE $DB;
EOSQL
done
