# BilancioFamiliare

BilancioFamiliare is a family budget management application. It features a Ruby on Rails backend providing a RESTful API and an AngularJS frontend for a responsive user interface.

## Project Overview

- **Architecture:** Rails 5.2.x Backend / AngularJS 1.8 Frontend (SPA).
- **Backend Technologies:** Ruby on Rails, MySQL/MariaDB, ActionCable (Real-time updates), JWT (Authentication), Prometheus (Monitoring).
- **Frontend Technologies:** AngularJS, Webpacker (migrating to Shakapacker), Bootstrap 4, Chart.js (Data visualization).
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

# Run tests
docker-compose run web bin/rails test

# Run database migrations
docker-compose run web bin/rails db:migrate
```

### Local (non-Docker) — only if Docker is unavailable

```bash
bundle install && yarn install
bin/rails db:create db:migrate db:seed
bin/rails s
./bin/webpack-dev-server   # frontend assets
```

## Active Migration Plan (see PLAN.md for full details)

The project is being upgraded from Rails 5.2 → 8.0 in phases:

1. **Phase 1 (Frontend decoupling):** Move AngularJS templates from `app/views/pages/` to `public/templates/`, update `templateUrl` references in `config/bilancio-familiare-route.js`, clean up Rails routes and `angular_controller.rb`.
2. **Phase 2 (Shakapacker):** Replace `webpacker` gem/npm package with `shakapacker`.
3. **Phase 3 (Rails incremental):** 5.2 → 6.0 → 6.1 → 7.0 → 7.1 → 7.2 → 8.0.
4. **Phase 4 (Cleanup):** Remove legacy gems (`sassc-rails`, `coffee-rails`, `uglifier`), update Dockerfile.

When working on this project, always check which phase is active and do not skip steps.

## Development Conventions

- **Backend:** Standard Rails conventions. Models use `before_save` hooks to normalize `year`, `month`, `day` columns for efficient querying.
- **Frontend:** AngularJS 1.8 via Webpacker. JavaScript source in `app/javascript/`.
- **API/Auth:** JWT authentication; token stored in `sessionStorage` via `angular-jwt`.
- **Naming:** Model names are English (`Operation`, `Withdrawal`), but some DB/domain terminology uses Italian context (`Bilancio`, `Operazioni`).
- **Docker strategy:** Build immutable images with `--no-cache` to avoid volume-mount dependency conflicts. `Gemfile` uses `source 'http://rubygems.org'` to bypass SSL issues.

## Key Files

- `app/models/` — Core business logic and data models.
- `app/controllers/angular_controller.rb` — SPA entry point (being simplified in Phase 1).
- `app/javascript/bilancio-familiare.js` — Frontend app entry point and module config.
- `app/javascript/config/bilancio-familiare-route.js` — AngularJS route definitions with `templateUrl` paths.
- `config/routes.rb` — API and frontend route definitions.
- `docker-compose.yml` — Local development environment.
- `PLAN.md` — Full incremental upgrade plan.
