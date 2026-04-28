# Rails Upgrade Playbook (Agent Instructions)

This document is written for an AI agent executing a Rails version upgrade. It covers upgrading any Rails application from versions 5.x, 6.x, or 7.x to Rails 8.0.

Read the entire playbook before starting. Execute each phase in order. Do not skip phases.

---

## Phase 0 — Assess the starting state

Before touching anything, collect the following facts. You will need them in later phases.

```bash
# Current Rails version
bundle exec rails --version

# Ruby version
ruby --version

# Full gem list with versions
bundle list

# Check for deprecation warnings (run any test or rake task)
bundle exec rails test 2>&1 | grep -i "deprecated\|warning"

# Understand the asset pipeline
grep -E "webpacker|shakapacker|sprockets|vite|propshaft" Gemfile
ls config/webpack/ 2>/dev/null && echo "webpack present" || echo "no webpack"

# Check cable/cache adapters
cat config/cable.yml
cat config/environments/production.rb | grep cache_store

# Understand the test suite
bundle exec rails test 2>&1 | tail -5
```

Record:
- `CURRENT_VERSION` — e.g. `5.2.4`
- `RUBY_VERSION` — e.g. `2.6.8`
- `ASSET_PIPELINE` — one of: `sprockets`, `webpacker`, `shakapacker`, `vite`, `propshaft`
- `CACHE_ADAPTER` — e.g. `dalli`, `redis`, `memory`, `solid_cache`
- `CABLE_ADAPTER` — e.g. `redis`, `async`, `solid_cable`
- `TEST_BASELINE` — result of running tests now (runs / failures / errors)

The upgrade must end with the same number of test runs and zero new failures.

---

## Phase 0.5 — Test coverage baseline

**Run this phase immediately after Phase 0, before touching any gem version.**

A version upgrade can only be done safely if there is a test suite that catches regressions. If coverage is insufficient, write tests now. Do not start upgrading until the baseline is solid.

### What counts as sufficient coverage

#### Backend (Rails — minitest or Rspec)

For each controller:
- Every action (`index`, `show`, `new`, `create`, `edit`, `update`, `destroy`) returns the correct HTTP status for a valid authenticated request.
- `401 Unauthorized` is returned for requests without a valid token (if the app uses JWT or session auth).
- `422 Unprocessable Content` (or `422 Unprocessable Entity`) is returned when required params are missing or invalid.
- `404 Not Found` is returned for non-existent records.
- Any collection action that filters, paginates, or searches is tested with and without filter params.

For each model:
- All `validates` declarations are exercised (presence, length, uniqueness, format, numericality).
- All `belongs_to`, `has_many`, `has_one` associations exist and load without error.
- All `before_save`, `before_validation`, `after_create` hooks execute and produce the expected side effects.
- Any custom instance or class method is tested directly.

For ActionCable channels (if present):
- `subscribed` authenticates and creates the correct stream.
- `unsubscribed` cleans up.
- Any `received`/action method updates state correctly.

#### Frontend (Vitest, Jest, or equivalent)

For each pure utility function (grouping, filtering, formatting, chart data builders):
- At least one test per public function covering the happy path with realistic data.
- One test per known edge case (empty array, single element, missing field).

For each Pinia store (or Vuex module):
- Every action is tested: assert that state is mutated correctly after the action resolves.
- Every getter is tested: assert the correct derived value is returned from a known state.
- Auth actions: `login` stores the token; `logout` clears it; an invalid token is rejected.

For each HTTP service layer (`api.ts`, service files):
- Mock `fetch` globally; assert the correct URL, method, and headers are sent.
- Assert that a `401` response triggers logout/redirect.
- Assert that a `204` response does not attempt to parse JSON.

Component tests (lower priority but useful for critical views):
- The login form submits correctly and transitions to the authenticated state.
- A list view renders the expected number of items from a mocked store.
- A form with validation shows error messages on invalid submission.

### How to assess existing coverage

```bash
# Backend — count test files and run with verbose output
find test/ -name "*_test.rb" | wc -l
bundle exec rails test --verbose 2>&1 | grep -E "PASS|FAIL|ERROR|#"

# Check which controllers have no test file
for f in app/controllers/*_controller.rb; do
  name=$(basename $f _controller.rb)
  test_file="test/controllers/${name}_controller_test.rb"
  [ ! -f "$test_file" ] && echo "MISSING: $test_file"
done

# Check which models have no test file
for f in app/models/*.rb; do
  name=$(basename $f .rb)
  test_file="test/models/${name}_test.rb"
  [ ! -f "$test_file" ] && echo "MISSING: $test_file"
done

# Frontend — check if a test runner is configured
ls vitest.config.* jest.config.* 2>/dev/null || echo "No frontend test runner configured"
find . -path ./node_modules -prune -o -name "*.test.ts" -print -o -name "*.spec.ts" -print | grep -v node_modules
```

### Writing missing backend tests

Use this template for a controller test. Replace `Widget` and fields with the actual model.

```ruby
# test/controllers/widgets_controller_test.rb
require 'test_helper'

class WidgetsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user    = users(:one)
    @widget  = widgets(:one)
    @headers = auth_headers(@user)   # adapt to your auth helper
  end

  test "index returns 200 with auth" do
    get widgets_path, headers: @headers
    assert_response :success
  end

  test "index returns 401 without auth" do
    get widgets_path
    assert_response :unauthorized
  end

  test "show returns the widget" do
    get widget_path(@widget), headers: @headers
    assert_response :success
  end

  test "show returns 404 for unknown id" do
    get widget_path(id: 0), headers: @headers
    assert_response :not_found
  end

  test "create with valid params returns 201" do
    assert_difference('Widget.count') do
      post widgets_path, params: { widget: { name: 'new' } }, headers: @headers
    end
    assert_response :created
  end

  test "create with missing params returns 422" do
    post widgets_path, params: { widget: { name: '' } }, headers: @headers
    assert_response :unprocessable_content
  end

  test "update with valid params returns 200" do
    patch widget_path(@widget), params: { widget: { name: 'updated' } }, headers: @headers
    assert_response :success
    assert_equal 'updated', @widget.reload.name
  end

  test "destroy removes the record" do
    assert_difference('Widget.count', -1) do
      delete widget_path(@widget), headers: @headers
    end
    assert_response :no_content
  end
end
```

Use this template for a model test:

```ruby
# test/models/widget_test.rb
require 'test_helper'

class WidgetTest < ActiveSupport::TestCase
  test "valid widget saves" do
    widget = Widget.new(name: 'valid')
    assert widget.valid?
  end

  test "name is required" do
    widget = Widget.new(name: '')
    assert_not widget.valid?
    assert_includes widget.errors[:name], "can't be blank"
  end

  # Add one test per validates/before_save/custom method
end
```

### Writing missing frontend tests

If no frontend test runner is configured, add Vitest (for Vite projects):

```bash
yarn add -D vitest @vue/test-utils jsdom
```

Add to `vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import RubyPlugin from 'vite-plugin-ruby'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
  plugins: [RubyPlugin()],
})
```

Add to `package.json`:
```json
"scripts": {
  "test": "vitest run"
}
```

Template for a pure utility function test:

```ts
// app/frontend/utils/__tests__/operationsGrouping.test.ts
import { describe, it, expect } from 'vitest'
import { filterOperationsMonth } from '../operationsGrouping'

const ops = [
  { id: 1, sign: 'negative', type_id: 2, amount: 100, year: 2024, month: 3 },
  { id: 2, sign: 'positive', type_id: 5, amount: 200, year: 2024, month: 3 },
]

describe('filterOperationsMonth', () => {
  it('groups by sign then type', () => {
    const result = filterOperationsMonth(ops)
    expect(result.negative).toBeDefined()
    expect(result.positive).toBeDefined()
  })

  it('returns empty groups for empty input', () => {
    const result = filterOperationsMonth([])
    expect(Object.keys(result)).toHaveLength(0)
  })
})
```

Template for a Pinia store test:

```ts
// app/frontend/stores/__tests__/auth.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'

describe('useAuthStore', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('is not authenticated initially', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)
  })

  it('login stores token and user', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'abc123', user: { id: 1, name: 'Test' } }),
    })
    const store = useAuthStore()
    await store.login('user@example.com', 'password')
    expect(store.token).toBe('abc123')
    expect(store.isAuthenticated).toBe(true)
  })

  it('logout clears token and user', () => {
    const store = useAuthStore()
    store.$patch({ token: 'abc', currentUser: { id: 1, name: 'Test' } })
    store.logout()
    expect(store.token).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })
})
```

### Running tests at each phase

From Phase 3 onward, run **both** suites at step 3.5 before moving to the next version:

```bash
# Backend
bundle exec rails test

# Frontend (if configured)
yarn test
# or: npx vitest run
```

Both must pass with zero failures before proceeding. If the frontend test runner is not yet configured, set it up during Phase 0.5 and include at least the utility function tests before starting the version bumps.

Record the combined baseline:
- `BE_BASELINE` — e.g. `101 runs, 188 assertions, 0 failures`
- `FE_BASELINE` — e.g. `12 tests passed`

---

## Phase 1 — Determine the upgrade path

Rails requires upgrading one minor version at a time. Skipping versions breaks things silently.

**Mandatory path:**

```
5.0 → 5.1 → 5.2 → 6.0 → 6.1 → 7.0 → 7.1 → 7.2 → 8.0
```

If `CURRENT_VERSION` is already at 6.0, start from `6.0 → 6.1 → ...`.

For each step, you will:
1. Bump the Rails version in `Gemfile`
2. Run `bundle update rails`
3. Run `bundle exec rails app:update` (accept changes with care — review diffs)
4. Update `config.load_defaults` in `config/application.rb`
5. Run the test suite and fix failures before proceeding

---

## Phase 2 — Ruby version compatibility

Check that your Ruby version is supported by the target Rails version.

| Rails version | Minimum Ruby |
|---|---|
| 6.0 | 2.5 |
| 6.1 | 2.5 |
| 7.0 | 2.7 |
| 7.1 | 2.7 |
| 7.2 | 3.1 |
| 8.0 | 3.2 |

If Ruby must be upgraded, do it **before** upgrading Rails. Update `.ruby-version`, `Dockerfile` (if present), and CI configuration. Verify the app boots and tests pass on the new Ruby version with the current Rails version before proceeding.

Known Ruby → Rails migration issues:
- Ruby 3.0+: keyword argument separation is strict. Fix any `def foo(opts)` called as `foo(a: 1)` that was relying on hash-to-kwargs coercion.
- Ruby 3.1+: `Hash#transform_keys` and pattern matching changes. Unlikely to affect typical Rails apps.
- Ruby 3.2+: `logger` gem no longer bundled with stdlib. Add `gem 'logger'` to `Gemfile` if missing.

---

## Phase 3 — Step-by-step version bumps

Repeat the following procedure for **each version step**. Do not batch steps.

### 3.1 — Bump the version

Edit `Gemfile`:
```ruby
gem 'rails', 'X.Y.Z'  # bump to next version
```

Then:
```bash
bundle update rails --conservative
```

If `bundle update rails` fails due to dependency conflicts:
```bash
bundle update rails activesupport actionpack actionview activerecord actionmailer actioncable activemodel activejob activestorage railties
```

### 3.2 — Run the upgrade task

```bash
bundle exec rails app:update
```

This generates/updates config files. For each file it proposes to overwrite:
- **Accept** changes to `config/initializers/new_framework_defaults_X_Y.rb`
- **Review and merge manually**: `config/environments/*.rb`, `config/application.rb`, `config/routes.rb`
- **Reject** overwrites of app-specific files you have customized

### 3.3 — Update load_defaults

In `config/application.rb`, update:
```ruby
config.load_defaults X.Y
```

### 3.4 — Handle version-specific breaking changes

Apply the fixes listed in Phase 4 for this specific version step.

### 3.5 — Run both test suites

```bash
# Backend
bundle exec rails test

# Frontend (if configured — see Phase 0.5)
yarn test
```

Both must match their baselines (`BE_BASELINE` and `FE_BASELINE`) with zero new failures before proceeding to the next version step. Fix failures before moving on — never carry a red test into the next upgrade step.

---

## Phase 4 — Version-specific breaking changes

Apply only the sections that match the version step you are executing.

### 5.2 → 6.0

**Autoloader:**
- Add `gem 'zeitwerk'` to `Gemfile` if not already present.
- In `config/application.rb`, remove any `config.autoload_paths += [...]` that adds non-standard paths. Rails 6 autoloads `app/` subdirectories automatically.
- If you have `require` statements for app files (models, services), remove them — Zeitwerk handles it.
- Run `bundle exec rails zeitwerk:check` to detect naming violations.

**Callbacks:**
- `before_action` / `after_action` callback chains changed subtly. Run tests.

**Action Text / Active Storage:**
- These are now built-in. If you are not using them, no action needed.

**Config:**
```ruby
# config/application.rb
config.load_defaults 6.0
```

### 6.0 → 6.1

**Multiple DB support (new default):**
- If you use a single database (typical), add to `config/application.rb`:
  ```ruby
  config.active_record.legacy_connection_handling = false
  ```
  Or leave it out — the new behavior is fine for single-DB apps.

**belongs_to required by default:**
- Already the default since 5.2. No change needed.

**Config:**
```ruby
config.load_defaults 6.1
```

### 6.1 → 7.0

**Asset pipeline — critical:**
- Rails 7 does not include Sprockets by default. Check `ASSET_PIPELINE`:
  - If `sprockets`: add `gem 'sprockets-rails'` explicitly to keep it working.
  - If `webpacker`: see Phase 5 (Webpacker deprecation).
  - If `shakapacker` or `vite`: no change needed.
- Remove `gem 'coffee-rails'` — CoffeeScript is dead and incompatible.
- Remove `gem 'uglifier'` — JS minification is no longer done by Ruby.
- Remove `gem 'sassc-rails'` if using a JS-based CSS pipeline. Keep it only if still using the Ruby asset pipeline.

**Encrypted attributes:**
- If you use `attr_encrypted` or similar: review compatibility.

**Active Record:**
- `where` with `nil` values now raises in some contexts. Search for `.where(foo: nil)` patterns.

**Config:**
```ruby
config.load_defaults 7.0
```

### 7.0 → 7.1

**Error objects:**
- `model.errors[:field]` now returns `ActiveModel::Error` objects, not strings. If any view or test calls `.errors[:field].first` and expects a String, wrap with `.full_message` or `.message`.

**Config:**
```ruby
config.load_defaults 7.1
```

Remove from `config/environments/production.rb` if present:
```ruby
config.action_view.raise_on_missing_translations  # deprecated, removed
```

### 7.1 → 7.2

**Puma version:**
- Rails 7.2 requires Puma >= 5.0. Update `Gemfile`:
  ```ruby
  gem 'puma', '~> 6.0'
  ```

**Config:**
```ruby
config.load_defaults 7.2
```

### 7.2 → 8.0

**Solid Cache (replaces Dalli/Memcache/Redis cache):**
- Add to `Gemfile`:
  ```ruby
  gem 'solid_cache'
  ```
- Remove `gem 'dalli'` if present.
- Generate migration:
  ```bash
  bundle exec rails solid_cache:install
  ```
  Or create the migration manually (see `docs/database-upgrade.md` for the DDL).
- Update `config/environments/production.rb`:
  ```ruby
  config.cache_store = :solid_cache_store
  ```

**Solid Cable (replaces Redis ActionCable):**
- Add to `Gemfile`:
  ```ruby
  gem 'solid_cable'
  ```
- Generate migration:
  ```bash
  bundle exec rails solid_cable:install
  ```
  Or create the migration manually.
- Update `config/cable.yml`:
  ```yaml
  production:
    adapter: solid_cable
    polling_interval: 0.1.seconds
    message_retention: 1.day
  development:
    adapter: solid_cable
  test:
    adapter: test
  ```
- Remove Redis from `Gemfile` and from infrastructure if no other service depends on it.

**Logger gem:**
- Add to `Gemfile` if not present:
  ```ruby
  gem 'logger'
  ```

**Status code symbol deprecation:**
- Rails 8 / Rack 3 deprecates `:unprocessable_entity` in favour of `:unprocessable_content`. The symbol still works; fix when convenient.

**Config:**
```ruby
config.load_defaults 8.0
```

---

## Phase 5 — Asset pipeline migration (if needed)

This phase applies only if `ASSET_PIPELINE` is `webpacker` or `shakapacker` and you are migrating away from it.

**Decision:** Webpacker/Shakapacker is deprecated. Rails 8 ships with Propshaft + Importmap by default, but Vite (`vite_rails`) is a strong alternative for apps with complex frontend builds.

### Option A — Migrate to Vite (recommended for SPA/Vue/React apps)

1. Add gems/packages:
   ```ruby
   # Gemfile
   gem 'vite_rails'
   ```
   ```bash
   yarn add vite vite-plugin-ruby @vitejs/plugin-vue  # adapt to your framework
   ```

2. Run the Vite Rails installer:
   ```bash
   bundle exec vite install
   ```

3. Move JS entry points from `app/javascript/packs/` to `app/frontend/entrypoints/`.

4. Update the layout: replace `javascript_pack_tag` with `vite_javascript_tag`.

5. Remove from `Gemfile`: `shakapacker`, `webpacker`.

6. Delete: `config/webpack/`, `babel.config.js`, `.postcssrc.yml` (if Shakapacker-owned).

7. Add to `.gitignore`:
   ```
   /public/vite/
   /public/vite-dev/
   /public/vite-test/
   ```

8. Create `vite.config.ts`:
   ```ts
   import { defineConfig } from 'vite'
   import RubyPlugin from 'vite-plugin-ruby'

   export default defineConfig({
     css: { postcss: {} },  // prevent Vite from picking up stale .postcssrc.yml
     plugins: [RubyPlugin()],
   })
   ```
   The `css: { postcss: {} }` line is important if any `.postcssrc.yml` exists anywhere in the project tree — Vite will find and try to parse it with a different yaml library version.

### Option B — Migrate to Propshaft + Importmap (simpler, no build step)

Suitable for apps that do not use npm packages extensively.

```bash
bundle exec rails propshaft:install
bundle exec rails importmap:install
```

Move JS from `app/javascript/` to `app/assets/javascripts/`. This is covered in detail in the [Rails Importmap guide](https://github.com/rails/importmap-rails).

---

## Phase 6 — Database migrations

Run pending migrations at the end of the upgrade:

```bash
bundle exec rails db:migrate
```

Verify the schema is consistent:
```bash
bundle exec rails db:schema:dump
git diff db/schema.rb
```

If the schema diff contains unexpected changes, investigate before committing.

---

## Phase 7 — Final verification

```bash
# All tests pass
bundle exec rails test

# App boots cleanly
bundle exec rails runner "puts Rails.version"

# No obvious deprecation warnings in tests
bundle exec rails test 2>&1 | grep -i "deprecated\|warning" | grep -v "vendor\|bundle"

# Assets compile (if using Vite)
bundle exec vite build

# Check Gemfile has no leftover dead gems
grep -E "coffee-rails|uglifier|sassc-rails|jquery-rails|dalli|webpacker" Gemfile && echo "REVIEW: legacy gems still present"
```

---

## Common failure patterns

### `Bundler::GemNotFound` when running tests in Docker

The `docker-compose run --rm web bin/rails test` command does not run `entrypoint.sh` (which installs gems). Use `exec` on an already-running container instead:

```bash
docker-compose up -d
docker-compose exec web bin/rails test
```

Or run `bundle install` explicitly before the test command.

### `yaml.parse is not a function` in Vite build

Vite is picking up a `.postcssrc.yml` from Shakapacker. Fix:
```ts
// vite.config.ts
export default defineConfig({
  css: { postcss: {} },
  plugins: [...]
})
```

### `require('some-npm-package')` fails in Vite

Vite is ESM-only. Replace any `require()` calls in frontend code with `import`:
```ts
// wrong
const Foo = require('foo')
// correct
import * as Foo from 'foo'
```

### `Unexpected end of JSON input` on DELETE

The `fetch` wrapper is calling `response.json()` on a 204 No Content response. Fix:
```ts
if (response.status === 204 || response.headers.get('content-length') === '0') {
  return undefined
}
return response.json()
```

### Migration timestamp mismatch

If `db:migrate` tries to re-run a migration that already exists in production's `schema_migrations`, the migration file's timestamp prefix does not match the recorded one.

1. Check production:
   ```sql
   SELECT version FROM schema_migrations ORDER BY version;
   ```
2. Rename the migration file to match:
   ```bash
   mv db/migrate/WRONG_TIMESTAMP_create_foo.rb db/migrate/CORRECT_TIMESTAMP_create_foo.rb
   ```
3. Do not change the class name inside the file.

### `ZeitwerkError: expected file ... to define constant`

A file's name does not match its class/module name under Zeitwerk's conventions. Fix the file name or the constant name. Run `bundle exec rails zeitwerk:check` to find all violations at once.

### Test uses `:unprocessable_entity` and Rails 8 warns

Update test assertions:
```ruby
# old
assert_response :unprocessable_entity
# new (preferred in Rails 8 / Rack 3)
assert_response :unprocessable_content
```

Both work during the transition; fix when convenient.

---

## Checklist (copy this into your task tracker)

- [ ] Phase 0: baseline recorded (version, ruby, asset pipeline, cache, cable, test count)
- [ ] Phase 0.5: BE coverage assessed — missing controller/model tests written
- [ ] Phase 0.5: FE coverage assessed — Vitest configured; utility/store/service tests written
- [ ] Phase 0.5: `BE_BASELINE` and `FE_BASELINE` recorded and both green
- [ ] Phase 1: upgrade path determined
- [ ] Phase 2: Ruby version compatible (upgrade if needed); tests green on new Ruby
- [ ] Phase 3+4: 5.2 step done — BE + FE tests green (if applicable)
- [ ] Phase 3+4: 6.0 step done — BE + FE tests green (if applicable)
- [ ] Phase 3+4: 6.1 step done — BE + FE tests green (if applicable)
- [ ] Phase 3+4: 7.0 step done — BE + FE tests green (if applicable)
- [ ] Phase 3+4: 7.1 step done — BE + FE tests green (if applicable)
- [ ] Phase 3+4: 7.2 step done — BE + FE tests green (if applicable)
- [ ] Phase 3+4: 8.0 step done — BE + FE tests green
- [ ] Phase 5: asset pipeline migrated (if applicable); FE tests still green
- [ ] Phase 6: `db:migrate` run, schema diff reviewed
- [ ] Phase 7: all tests pass, no new deprecation warnings, assets compile
- [ ] Gemfile cleaned of legacy gems
- [ ] Documentation updated
