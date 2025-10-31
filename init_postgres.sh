#!/bin/bash
set -e  # Exit immediately if a command fails

echo "Starting PostgreSQL initialization"

DB_NAME="mydatabase"
DB_USER="myuser"
DB_PASS="mypassword"
PG_VERSION="15"


echo "Updating apt and installing PostgreSQL"
apt update -y
apt install -y postgresql postgresql-contrib locales

# echo "Setting locale to en_US.UTF-8"
# locale-gen en_US.UTF-8
# update-locale LANG=en_US.UTF-8

# THEY ARE MESSING THINGS UP!

echo "Starting PostgreSQL cluster"
pg_ctlcluster $PG_VERSION main start || \
su - postgres -c "/usr/lib/postgresql/$PG_VERSION/bin/pg_ctl -D /var/lib/postgresql/$PG_VERSION/main start"

sleep 3

echo "Creating database and user (if not exists)"

DB_EXISTS=$(runuser -u postgres -- psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")
if [ "$DB_EXISTS" != "1" ]; then
  echo "Creating database: $DB_NAME"
  runuser -u postgres -- psql -c "CREATE DATABASE $DB_NAME;"
else
  echo "Database $DB_NAME already exists"
fi

USER_EXISTS=$(runuser -u postgres -- psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'")
if [ "$USER_EXISTS" != "1" ]; then
  echo "Creating user: $DB_USER"
  runuser -u postgres -- psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
else
  echo "User $DB_USER already exists"
fi

echo "Granting privileges on database"
runuser -u postgres -- psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

echo "Setting schema permissions"
runuser -u postgres -- psql -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
runuser -u postgres -- psql -d $DB_NAME -c "ALTER ROLE $DB_USER SET search_path TO public;"
runuser -u postgres -- psql -d $DB_NAME -c "ALTER SCHEMA public OWNER TO $DB_USER;"

echo "PostgreSQL initialization complete"
echo "Database: $DB_NAME"
echo "User:     $DB_USER"
echo "Password: $DB_PASS"
echo "---------------------------------------"