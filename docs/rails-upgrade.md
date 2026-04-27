# Rails Upgrade: 5.2 → 8.0

This document describes the incremental upgrade path followed to bring BilancioFamiliare from Rails 5.2 to Rails 8.0.

---

## Why incremental?

Rails does not support skipping major versions. Each minor version introduced breaking changes that had to be resolved before moving forward. The path was:

**5.2 → 6.0 → 6.1 → 7.0 → 7.1 → 7.2 → 8.0**

---

## Step-by-step changes

### 5.2 → 6.0
- Added `zeitwerk` gem (new autoloader replacing classic mode).
- Added `concurrent-ruby` gem (required by Rails 6 internals).
- Replaced `config.autoload_paths` with `config.eager_load_paths` where needed.
- Replaced `ActionDispatch::Http::UploadedFile` references with `ActionDispatch::Http::UploadedFile` (no change needed here, but verified).
- Removed `config.active_record.sqlite3.represent_boolean_as_integer` (not used with MySQL).
- Updated `config/application.rb` to use `config.load_defaults 6.0`.

### 6.0 → 6.1
- Updated `config.load_defaults` to `6.1`.
- `ActiveRecord::Base.legacy_connection_handling = false` (new in 6.1, opt-in).
- Removed explicit `config.active_record.belongs_to_required_by_default` (now the default).

### 6.1 → 7.0
- Updated `config.load_defaults` to `7.0`.
- Replaced `config.assets.*` references — Sprockets removed as default.
- Removed `uglifier`, `sassc-rails`, `coffee-rails` gems (no longer needed).
- Added `logger` gem (extracted from stdlib in Ruby 3.x).
- Verified `jbuilder` compatibility (2.x works with Rails 7).

### 7.0 → 7.1
- Updated `config.load_defaults` to `7.1`.
- `ActiveRecord::Base.raise_on_open_transactions_in_tests` = true by default (no impact, tests already clean).
- Updated `config/environments/production.rb` to remove deprecated `config.action_view.raise_on_missing_translations`.

### 7.1 → 7.2
- Updated `config.load_defaults` to `7.2`.
- Bumped `puma` to `~> 6.0` (required by Rails 7.2 minimum).

### 7.2 → 8.0
- Updated `config.load_defaults` to `8.0`.
- Added `solid_cache` and `solid_cable` gems (Rails 8 defaults for cache/cable without Redis).
- Removed `dalli` gem (Memcache client, replaced by Solid Cache).
- Removed Redis dependency entirely.
- Added `bin/rails db:migrate` to create `solid_cache_entries` and `solid_cable_messages` tables.
- Updated `config/cable.yml` to use `solid_cable` adapter.
- Updated `config/environments/production.rb` to use `config.cache_store = :solid_cache_store`.

---

## Gems removed during upgrade

| Gem | Reason |
|---|---|
| `sassc-rails` | Sprockets/asset pipeline removed |
| `coffee-rails` | CoffeeScript support removed |
| `uglifier` | JS minification no longer via Ruby |
| `dalli` | Replaced by Solid Cache |
| `jquery-rails` | Frontend no longer uses jQuery |
| `shakapacker` | Replaced by Vite (see `angularjs-to-vue.md`) |
| `webpacker` | Predecessor of shakapacker, removed earlier |
| `chartkick` | Charts moved to frontend (Chart.js 4 + vue-chartjs) |

---

## Gems added

| Gem | Purpose |
|---|---|
| `zeitwerk` | Modern autoloader (required by Rails 6+) |
| `concurrent-ruby` | Rails 6+ internal dependency |
| `logger` | Extracted from Ruby stdlib in Ruby 3.x |
| `solid_cache` | Database-backed cache store (replaces Dalli/Redis) |
| `solid_cable` | Database-backed ActionCable adapter (replaces Redis) |
| `vite_rails` | Vite integration for Ruby on Rails |
| `prometheus-client` | Metrics endpoint |
| `annotaterb` | Annotate models with schema info |

---

## Notes

- The MySQL schema was compatible across all versions without any changes to existing tables.
- Tests (`bin/rails test`) were run and verified green at each major step.
- The Gemfile uses `source 'http://rubygems.org'` (HTTP, not HTTPS) to bypass Zscaler SSL interception in the Docker build environment.
