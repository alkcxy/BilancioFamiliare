# Piano di Aggiornamento Rails e AngularJS

Questo piano descrive i passi necessari per aggiornare BilancioFamiliare all'ultima versione di Rails (8.0), isolando al contempo il frontend AngularJS per permettere aggiornamenti indipendenti.

## Obiettivo
*   Aggiornare Rails da 5.2 a 8.0 in modo incrementale.
*   Disaccoppiare il frontend AngularJS dal sistema di rendering di Rails.
*   Sostituire Webpacker con Shakapacker per mantenere la compatibilità con le versioni moderne di Rails.
*   **Nota:** Tutte le operazioni di sviluppo, test e build devono essere eseguite esclusivamente tramite Docker (`docker-compose`).

## Approccio TDD

Ogni step di aggiornamento deve seguire un approccio **Test-Driven Development**:

1.  **Prima di ogni modifica:** verificare che la suite di test esistente passi al 100% (`docker-compose exec -e RAILS_ENV=test web bin/rails test`).
2.  **Aggiungere test per la copertura mancante:** prima di cambiare codice, scrivere test che coprano il comportamento attuale (render, layout, response format, autenticazione, validazioni, route custom).
3.  **Eseguire l'upgrade:** modificare dipendenze e configurazioni.
4.  **Verificare con i test:** la suite deve passare dopo ogni singolo step. Se un test fallisce, correggere prima di proseguire.
5.  **Aggiungere test per nuovi comportamenti:** se l'upgrade introduce nuove API o cambia default, aggiungere test che li coprano.

### Copertura attuale (59 test, 88 assertion)
| Controller               | Test | Copertura                                                           |
|--------------------------|------|---------------------------------------------------------------------|
| `AngularController`      | 4    | Root → 200, layout angular, pack tag, ng-view                      |
| `SessionsController`     | 3    | Login valido/invalido, email inesistente                            |
| `OperationsController`   | 18   | CRUD, max, calendar_month/year, filtri, 401, validazioni invalide   |
| `TypesController`        | 10   | CRUD, 401 senza auth, validazioni invalide                         |
| `WithdrawalsController`  | 11   | CRUD, all, archive, validazioni invalide                           |
| `UsersController`        | 7    | CRUD (no destroy)                                                   |
| Model test               | 6    | Operation, Type, User, Withdrawal                                  |

### Test mancanti da aggiungere progressivamente
- `UsersController`: 401 senza auth, validazioni invalide
- Tutti i controller: verifica formato JSON response body
- `SessionsController`: token JWT decode, expiry, blocked user
- Model test: scope, before_save hooks, associazioni
- ActionCable broadcast in create/update/destroy (OperationsController, TypesController)

## Fase 1: Disaccoppiamento Frontend (Baseline) — ✅ COMPLETATA

1.  ✅ **Spostamento Template:** file `.html` spostati da `app/views/pages/` a `public/templates/`.
2.  ✅ **Aggiornamento Rotte AngularJS:** `templateUrl` aggiornati in `bilancio-familiare-route.js`.
3.  ✅ **Pulizia Rails:** rotta `pages` e azione `page` rimosse.
4.  ✅ **Verifica:** template statici serviti da `public/`.

## Fase 2: Migrazione a Shakapacker — ✅ COMPLETATA

1.  ✅ `gem 'webpacker'` → `gem 'shakapacker', '~> 7.0'`
2.  ✅ `@rails/webpacker` → `shakapacker` in `package.json`
3.  ✅ Configurazione `config/shakapacker.yml` funzionante.

## Fase 3: Aggiornamento Incrementale Rails

### 3.1 Rails 5.2 → 6.0 — ✅ COMPLETATA
### 3.2 Rails 6.0 → 6.1 — ✅ COMPLETATA
### 3.3 Rails 6.1 → 7.0 — ✅ COMPLETATA

Fix applicati durante 7.0:
- `AngularController`: `render layout: 'angular.html.erb'` → `render layout: 'angular'` (Rails 7.0 template resolver più rigido).

### 3.4 Rails 7.0 → 7.1 — ✅ COMPLETATA

Fix applicati:
- Ruby aggiornato da 2.7 a 3.2 nel Dockerfile (nessuna incompatibilità riscontrata).
- `config.action_dispatch.show_exceptions` da `false` a `:none` in test.rb.
- `config.cache_classes` → `config.enable_reloading` in tutti gli environment.
- `config.load_defaults` aggiornato a `7.1`.
- `Rails.application.secrets[:token_key_base]` → `Rails.application.config.bilancio[:token_key_base]` (3 file: application_controller.rb, operation_channel.rb, test_helper.rb).
- `secret_key_base` spostato da `secrets.yml` a initializer `config/initializers/secret_key_base.rb` (legge da ENV in production).
- `serialize :spending_limit, JSON` → `serialize :spending_limit, coder: JSON` in Type model.
- `token_key_base` aggiunto a `config/bilancio.yml` per tutti gli environment.

### 3.5 Rails 7.1 → 7.2 — ✅ COMPLETATA

Nessun fix necessario — upgrade diretto. `load_defaults` aggiornato a 7.2. 59 test passano senza deprecation.

### 3.6 Rails 7.2 → 8.0 — ✅ COMPLETATA

Fix applicati:
- `puma` da `~> 5.0` a `~> 6.0` (richiesto da Rails 8).
- `annotate` sostituito con `annotaterb` (annotate 3.2 non supporta activerecord >= 8.0).
- `config.autoloader = :zeitwerk` rimosso (è l'unico autoloader in Rails 8.0).
- `config.load_defaults` aggiornato a `8.0`.

## Fase 3 — ✅ COMPLETATA

Percorso completato: Rails 5.2 → 6.0 → 6.1 → 7.0 → 7.1 → 7.2 → 8.0.2
Ruby aggiornato: 2.7 → 3.2.
Suite di test: 59 test, 88 assertion, tutti verdi a ogni step.

## Fase 4: Pulizia e Modernizzazione — ✅ COMPLETATA

### 4.1 Rimozione Gemme Legacy — ✅

Gemme rimosse dal Gemfile (14 totali):
- `sassc-rails`, `coffee-rails`, `uglifier` — sostituiti da Shakapacker pipeline
- `spring`, `spring-watcher-listen` — rimossi come default da Rails 7+
- `web-console` — non necessario con sviluppo Docker
- `sass-rails` — duplicato di sassc-rails
- `turbolinks` — non usato (SPA AngularJS)
- `capistrano-*` (4 gemme) — deploy non gestito via Capistrano
- `annotate` — sostituito con `annotaterb` (compatibile Rails 8)
- `chartkick` — non usato (grafici gestiti da Chart.js/AngularJS)

Conteggio gemme: 101 → 86.

### 4.2 Conversione CoffeeScript → JavaScript — ✅

- `app/javascript/util/date-helper.coffee` → `date-helper.js` (ES module con export default)
- `app/javascript/util/form-repeater.coffee` → `form-repeater.js` (fix: usava `import` ES6 invalido in CoffeeScript)
- Rimossi `coffeescript` e `coffee-loader` da npm dependencies
- Rimossa regola `coffee-loader` ed estensione `.coffee` da `webpack.config.js`

### 4.3 Rimozione completa Sprockets — ✅

- Rimossa gemma `sprockets-rails` dal Gemfile
- Rimosso `config/initializers/assets.rb`
- Rimosso `app/assets/config/manifest.js`
- Rimosso `config.assets.compile = false` da `production.rb`
- Rimosso `config.assets.js_compressor = :uglifier` da `production.rb`
- Tutti gli asset sono ora gestiti esclusivamente da Shakapacker

### 4.4 Aggiornamento Dockerfile — ✅

- Ruby image: `2.7-bullseye` → `3.2-bullseye` (fatto in Fase 3.4)
- Node: multi-stage build con `node:20-bullseye-slim`
- Bundler aggiornato a 2.4.22

### 4.5 Note su Solid Cache / Solid Cable — ⏸ RIMANDATO

La sostituzione di `dalli` con Solid Cache e di `redis` con Solid Cable è rimandata a una fase futura. Richiede:
- Migrazione dati cache (valutare cold start vs warm migration)
- Configurazione Action Cable su Solid Cable
- Test di performance con il nuovo backend
- Queste dipendenze funzionano correttamente con Rails 8, non c'è urgenza di sostituirle

## Fase 4 — ✅ COMPLETATA

Cleanup completato. Stack finale:
- **Ruby:** 3.2 | **Rails:** 8.0.2 | **Node:** 20
- **Gemme:** 86 (da 101 iniziali)
- **Asset pipeline:** Shakapacker 7 (Sprockets completamente rimosso)
- **CoffeeScript:** completamente rimosso, convertito in JavaScript
- **Test:** 59 test, 88 assertion, tutti verdi

## Nota sulle Dipendenze
*   A causa di conflitti con i volumi montati, la strategia è costruire immagini Docker immutabili (`docker-compose build --no-cache`) per garantire coerenza tra dipendenze installate e ambiente di esecuzione. Il file `Gemfile` utilizza `source 'http://rubygems.org'` per bypassare problemi SSL.
