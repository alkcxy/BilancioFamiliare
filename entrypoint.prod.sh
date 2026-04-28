#!/bin/bash
set -e

rm -f tmp/pids/server.pid

echo "--- DB MIGRATION ---"
bundle exec rails db:migrate

echo "--- START SERVER ---"
exec bundle exec rails s -p 3000 -b '0.0.0.0'
