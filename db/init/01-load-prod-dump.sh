#!/bin/bash
set -e

echo "Loading production dump into bilancio_development..."
bzcat /docker-entrypoint-initdb.d/bilancio26.sql.bz2 \
  | sed 's/bilancio_production/bilancio_development/g' \
  | mysql -uroot -p"$MYSQL_ROOT_PASSWORD" bilancio_development

echo "Updating ar_internal_metadata environment to development..."
mysql -uroot -p"$MYSQL_ROOT_PASSWORD" bilancio_development \
  -e "UPDATE ar_internal_metadata SET value='development' WHERE \`key\`='environment';"

echo "Production dump loaded successfully."

echo "Creating bilancio_test database..."
mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS bilancio_test CHARACTER SET utf8mb4;"
echo "Test database created."
