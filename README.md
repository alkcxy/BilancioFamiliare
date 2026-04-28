# BilancioFamiliare

Family budget management application. Rails 8 JSON API backend, Vue 3 + Vite frontend.

---

## Architecture

- **Backend:** Ruby on Rails 8.0, MySQL/MariaDB, ActionCable (WebSocket), JWT authentication, Solid Cache, Solid Cable
- **Frontend:** Vue 3 (Composition API), Vite 6, Pinia, Vue Router 4, Chart.js 4 via vue-chartjs
- **Auth:** JWT token stored in Pinia/sessionStorage; sent as `Authorization: Bearer <token>` on every API request

---

## Prerequisites

- Docker and Docker Compose
- A `.env` file in the project root with the following variables:

```
MYSQL_USER=root
MYSQL_PASSWORD=root
MYSQL_HOST=db
ARTIFACTORY_USER=<your-username>
ARTIFACTORY_TOKEN=<your-token>
```

`ARTIFACTORY_USER` and `ARTIFACTORY_TOKEN` are needed by `entrypoint.sh` to configure the RubyGems mirror behind Zscaler. If running outside a corporate network, you can remove those mirror lines from `entrypoint.sh` and set a plain `bundle config unset mirror.https://rubygems.org`.

---

## Running the application

### Start everything

```bash
docker-compose up
```

This starts:
- `db` — MariaDB 10.5 on port 3306
- `web` — Rails server on port 3000 (runs `entrypoint.sh` which installs gems, installs JS packages, then starts Puma)

The first start takes a few minutes while gems and JS packages are installed.

Open `http://localhost:3000` in a browser.

### Rebuild after dependency changes

When `Gemfile` or `package.json` change:

```bash
docker-compose build --no-cache
docker-compose up
```

The `--no-cache` flag ensures a clean image without stale layers.

---

## Running tests

The test suite runs entirely in the Docker container. The web service must be running (or the db service at minimum).

```bash
# Run all tests (requires running container)
docker-compose exec web bin/rails test

# Run a specific test file
docker-compose exec web bin/rails test test/controllers/operations_controller_test.rb

# Run a specific test by line number
docker-compose exec web bin/rails test test/controllers/operations_controller_test.rb:42
```

If the web container is not already running, start it first:

```bash
docker-compose up -d
# wait ~60s for entrypoint to finish installing dependencies
docker-compose exec web bin/rails test
```

---

## Database

### First-time setup

```bash
docker-compose exec web bin/rails db:create db:migrate
```

### Run pending migrations

```bash
docker-compose exec web bin/rails db:migrate
```

### Reset (destroys all data)

```bash
docker-compose exec web bin/rails db:drop db:create db:migrate
```

---

## Frontend development

Vite runs in `autoBuild` mode by default (static build served by Rails). To get hot-module replacement during development:

1. Start Rails normally: `docker-compose up`
2. In a second terminal, start the Vite dev server inside the container:

```bash
docker-compose exec web bin/vite dev
```

Or run Vite locally (outside Docker) if Node.js is installed:

```bash
yarn install
yarn vite dev
```

Then open `http://localhost:3036` (Vite dev server proxies API calls to Rails on 3000).

---

## Project structure

```
app/
  controllers/        # Rails API controllers + VueController (SPA entry)
  models/             # Operation, Type, Withdrawal, User
  channels/           # OperationChannel (ActionCable)
  views/
    layouts/vue.html.erb   # SPA shell (just <div id="app">)
    operations/            # jbuilder JSON views
    types/
    withdrawals/
    users/
  frontend/                # Vue 3 source (compiled by Vite)
    entrypoints/
      application.ts       # Vite entry point
    stores/
      auth.ts              # JWT auth state (Pinia)
      operations.ts        # operations cache by year (Pinia)
    lib/
      api.ts               # fetch wrapper (adds Authorization header)
      cable.ts             # ActionCable consumer
    router/
      index.ts             # 21 routes
    views/                 # Vue page components
    components/            # Reusable Vue components
    utils/
      operationsGrouping.ts   # Grouping/filtering pure functions
      chartData.ts            # Chart dataset builder
config/
  routes.rb            # API routes + root → vue#index (SPA fallback)
  cable.yml            # Solid Cable adapter
db/
  migrate/             # ActiveRecord migrations
  schema.rb
docs/
  rails-upgrade.md     # Rails 5.2 → 8.0 upgrade notes
  angularjs-to-vue.md  # Frontend migration notes
  database-upgrade.md  # Production DB migration guide
```

---

## Further reading

- [Rails 5.2 → 8.0 upgrade notes](docs/rails-upgrade.md)
- [AngularJS → Vue 3 migration notes](docs/angularjs-to-vue.md)
- [Production database upgrade guide](docs/database-upgrade.md)
