#!/bin/bash
set -e

# Rimuove un eventuale server.pid esistente
rm -f /bilancio/tmp/pids/server.pid

echo "--- CONFIGURAZIONE AMBIENTE ---"
# Mirror RubyGems opzionale: impostare GEM_MIRROR in .env (URL completo, credenziali incluse)
if [ -n "${GEM_MIRROR}" ]; then
  bundle config set --local mirror.http://rubygems.org "${GEM_MIRROR}"
  bundle config set --local mirror.https://rubygems.org "${GEM_MIRROR}"
fi

yarn config set "strict-ssl" false -g
yarn config set registry "http://registry.npmjs.org/"

echo "--- INSTALLAZIONE GEMME ---"
export BUNDLE_TIMEOUT=120
# Loop finché non ha successo
until bundle install --retry 5 --jobs 4; do
  echo "Bundle install fallito, riprovo tra 5 secondi..."
  sleep 5
done

echo "--- INSTALLAZIONE PACCHETTI JS ---"
until yarn install; do
  echo "Yarn install fallito, riprovo tra 5 secondi..."
  sleep 5
done

# Esegue le migrazioni se il DB è pronto
echo "--- VERIFICA DATABASE ---"
# Aspetta che il DB sia raggiungibile
until mysqladmin ping -h"db" -u"root" -p"root" --silent; do
    echo "In attesa del database..."
    sleep 2
done

# bundle exec rails db:migrate

echo "--- AVVIO SERVER RAILS ---"
exec bundle exec rails s -p 3000 -b '0.0.0.0'
