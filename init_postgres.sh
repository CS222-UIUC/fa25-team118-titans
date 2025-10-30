#!/bin/bash
DB_NAME="mydatabase"
DB_USER="myuser"
DB_PASS="mypassword"
PG_VERSION="15"

echo "Starting PostgreSQL..."
pg_ctlcluster $PG_VERSION main start 2>/dev/null || \
su - postgres -c "/usr/lib/postgresql/$PG_VERSION/bin/pg_ctl -D /var/lib/postgresql/$PG_VERSION/main start"

sleep 3

run_sql() {
    runuser -u postgres -- psql -d "$DB_NAME" -c "$1"
}

DB_EXISTS=$(runuser -u postgres -- psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")
if [ "$DB_EXISTS" != "1" ]; then
    echo "Creating database '$DB_NAME'..."
    runuser -u postgres -- psql -c "CREATE DATABASE $DB_NAME;"
fi

USER_EXISTS=$(runuser -u postgres -- psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'")
if [ "$USER_EXISTS" != "1" ]; then
    echo "Creating user '$DB_USER'..."
    runuser -u postgres -- psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
fi

echo "Granting privileges..."
runuser -u postgres -- psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

echo "Granting schema privileges..."
run_sql "GRANT ALL ON SCHEMA public TO $DB_USER;"
run_sql "ALTER ROLE $DB_USER SET search_path TO public;"
run_sql "ALTER SCHEMA public OWNER TO $DB_USER;"

echo "PostgreSQL initialization complete!"
