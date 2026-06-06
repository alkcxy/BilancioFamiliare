# BilancioFamiliare

BilancioFamiliare is a family budget management application. It features a Ruby on Rails backend providing a RESTful API and a Vue 3 frontend (SPA) built with Vite.

## Project Overview

- **Architecture:** Rails 8.1.x Backend / Vue 3 + Vite Frontend (SPA).
- **Backend Technologies:** Ruby on Rails, MySQL/MariaDB, ActionCable (Real-time updates), JWT + Authelia SSO (Authentication), Prometheus (Monitoring).
- **Frontend Technologies:** Vue 3 (Composition API, `<script setup>`), Vite, Pinia, Vue Router 4, Bootstrap 5, Chart.js / vue-chartjs (Data visualization).
- **Key Models:**
  - `Operation`: Individual financial transactions (income/expense).
  - `Type`: Categories for operations, supporting hierarchical structures (master-types) and spending limits.
  - `Withdrawal`: Cash withdrawals or specific bank movements.
  - `User`: Application users with authentication.

## Building and Running

**All development, test, and build operations must run exclusively via Docker (`docker-compose`).**

### Prerequisites

- Docker and Docker Compose
- `.env` file with `MYSQL_USER`, `MYSQL_PASSWORD`, and `MYSQL_HOST`

### Common Commands

```bash
# Start the full stack
docker-compose up

# Build from scratch (use when dependencies change)
docker-compose build --no-cache

# Start the stack and wait for it to be ready (bundle install runs inside entrypoint.sh)
docker-compose up -d
docker-compose logs -f web   # wait until "AVVIO SERVER RAILS" appears, then Ctrl-C

# Run backend tests (only after the stack is up — gems are installed by entrypoint.sh at startup)
docker-compose exec web bin/rails test

# Run frontend tests (Vitest + Vue Test Utils)
docker-compose exec web yarn test

# Run database migrations
docker-compose exec web bin/rails db:migrate

# Frontend HMR dev server (Vite serves a static autoBuild by default — this is opt-in)
docker-compose exec web bin/vite dev   # then open http://localhost:3036

# IMPORTANT: `docker-compose run --rm web bin/rails <cmd>` bypasses entrypoint.sh
# and fails with GemNotFound. Always use `exec` on a running container instead.
```

### Local (non-Docker) — only if Docker is unavailable

```bash
bundle install && yarn install
bin/rails db:create db:migrate db:seed
bin/rails s
yarn vite dev   # frontend HMR dev server
```

## Migration history

The Rails 5.2 → 8.1 upgrade and the AngularJS → Vue 3/Vite rewrite (PR #84) are both **complete** — there is no active migration plan (`PLAN.md` and a short-lived local `MIGRAZIONE.md`, both superseded mid-course, were removed). For rationale and step-by-step notes see `docs/rails-upgrade.md`, `docs/angularjs-to-vue.md`, `docs/bootstrap-4-to-5-playbook.md` and `docs/database-upgrade.md`. `docs/rails-upgrade-agent-playbook.md` is a reusable, project-agnostic agent playbook kept for the next major-version bump.

## Development Conventions

- **Backend:** Standard Rails conventions. Models use `before_save` hooks to normalize `year`, `month`, `day` columns for efficient querying.
- **Frontend:** Vue 3 SFCs in `app/frontend/` (entry point `app/frontend/entrypoints/application.ts`), served via `vite_javascript_tag` from the `vue` layout (`app/views/layouts/vue.html.erb`).
- **API/Auth:** JWT (token in `sessionStorage`, sent through the `lib/api.ts` fetch wrapper and the `stores/auth.ts` Pinia store) plus Authelia SSO (`SsoController`; see `docs/authelia-production-setup.md`).
- **Naming:** Model names are English (`Operation`, `Withdrawal`), but some DB/domain terminology uses Italian context (`Bilancio`, `Operazioni`).
- **Docker strategy:** Build immutable images with `--no-cache` to avoid volume-mount dependency conflicts. `Gemfile` uses `source 'http://rubygems.org'` to bypass SSL issues.

## Gotchas

- **`app/javascript/` is dead code.** It still holds the old AngularJS app (`bilancio-familiare.js`, `*-directives.js`, `packs/application.js`, ...) and is tracked in git, but nothing loads it — the only layout in use (`vue.html.erb`) renders the Vite/Vue entry point. Don't edit it; the live frontend is entirely under `app/frontend/`.
- **`config/shakapacker.yml`, `bin/webpack*`, `bin/shakapacker-dev-server` are orphaned leftovers** from the pre-Vite build setup. The active config is `config/vite.json` / `vite.config.ts` via the `vite_rails` gem — their presence isn't evidence the app still uses Shakapacker.

## Key Files

- `app/models/` — Core business logic and data models.
- `app/controllers/vue_controller.rb` — SPA entry point (renders the `vue` layout; routing is client-side via Vue Router).
- `app/frontend/entrypoints/application.ts` — Frontend entry point (mounts Vue + Pinia + Vue Router).
- `app/frontend/{App.vue,views/,components/,stores/,router/,lib/}` — Vue SFCs, Pinia stores, router, API client.
- `config/routes.rb` — API and frontend route definitions.
- `docker-compose.yml` — Local development environment.
