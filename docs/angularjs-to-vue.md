# Frontend Migration: AngularJS 1.8 → Vue 3 + Vite

This document describes the architectural decisions and porting strategy used to migrate BilancioFamiliare's frontend from AngularJS 1.8 to Vue 3 with Vite.

---

## Why Vue 3 (and not Hotwire)?

Hotwire was considered but ruled out for these reasons:

- **Auth is JWT-based.** All 13 backend test files authenticate via `Authorization: Bearer <token>`. Hotwire requires server-side sessions — migrating would mean rewriting auth before touching a single view.
- **Complex client-side logic.** `filterOperationsYear` (grouping by sign/type/month/quarter, cumulative balance, spending limit classification) would have to be rewritten in Ruby, making it slower and harder to test.
- **AngularJS and Turbo cannot coexist.** Angular's `ng-app` directive controls the entire `<html>` element digest cycle and conflicts with Turbo Drive.
- **Chart updates.** `updateCharts()` was 100+ lines of JS. In Hotwire this would need to become Ruby (slow) or a separate JSON endpoint + JS (no simplification).

Vue 3 was chosen because:

- The backend is a pure JSON API — zero backend changes required.
- Angular's `.component()` syntax and template directives map almost 1:1 to Vue (`ng-repeat` → `v-for`, `ng-model` → `v-model`, `ng-show` → `v-show`).
- All complex logic was already JavaScript and could be ported as TypeScript pure functions.
- Vite is dramatically simpler than Webpack 5 + Shakapacker.

---

## Stack

| Role | Old | New |
|---|---|---|
| Build tool | Webpack 5 (Shakapacker) | Vite 6 + `vite-plugin-ruby` |
| Framework | AngularJS 1.8 | Vue 3 (Composition API, `<script setup>`) |
| Router | `ui-router` | Vue Router 4 |
| State / Cache | `$rootScope` + `sessionStorage` | Pinia |
| HTTP | `$http` (Angular) | `fetch` wrapper (`lib/api.ts`) |
| Real-time | `action-cable-service.js` + `$(document).on(...)` | `actioncable` npm + Pinia store |
| Charts | Chartkick (Ruby gem) + Chart.js 2 | vue-chartjs 5 + Chart.js 4 |
| CSS | Bootstrap 4.5 (via sass-rails) | Bootstrap 4.5 (via npm, no jQuery) |

---

## Porting map

### Angular services → Vue services + Pinia stores

| Angular | Vue/Pinia |
|---|---|
| `operation-service.js` ($http + sessionStorage cache) | `services/operationService.ts` + `stores/operations.ts` |
| `type-service.js` | `services/typeService.ts` |
| `withdrawal-service.js` | `services/withdrawalService.ts` |
| `user-service.js` | `services/userService.ts` |
| `action-cable-service.js` | `lib/cable.ts` → `stores/operations.ts.applyUpdate()` |
| `auth-service.js` | `stores/auth.ts` |

### Angular filters → TypeScript utility functions

| Angular filter | TypeScript function |
|---|---|
| `filterOperationsMonth` | `utils/operationsGrouping.ts:filterOperationsMonth()` |
| `filterOperationsYear` | `utils/operationsGrouping.ts:filterOperationsYear()` |
| `filterByOr` | `utils/operationsGrouping.ts:filterByOr()` |
| `filterMapProps` | inlined in grouping utils |
| `filterSortObjectProps` | inlined in grouping utils |
| `updateCharts()` | `utils/chartData.ts:buildChartData()` |

### Angular components → Vue components (1:1)

| Angular component | Vue component |
|---|---|
| `formLogin` | `views/FormLogin.vue` |
| `operationsList` | `views/operations/OperationsList.vue` |
| `operationShow` | `views/operations/OperationShow.vue` |
| `operationForm` | `views/operations/OperationForm.vue` |
| `formRepeater` | `views/operations/FormRepeater.vue` |
| `tableMonth` | `views/operations/TableMonth.vue` |
| `tableYear` | `views/operations/TableYear.vue` |
| `navigationMonth` | inlined in `views/operations/MonthView.vue` |
| `navigationYear` | inlined in `views/operations/YearView.vue` |
| `typesList` | `views/TypesList.vue` |
| `typeShow` | `views/TypeShow.vue` |
| `typeForm` | `views/TypeForm.vue` |
| `withdrawalsList` | `views/WithdrawalsList.vue` |
| `withdrawalShow` | `views/WithdrawalShow.vue` |
| `withdrawalForm` | `views/WithdrawalForm.vue` |
| `usersList` | `views/UsersList.vue` |
| `userShow` | `views/UserShow.vue` |
| `userForm` | `views/UserForm.vue` |
| Home dashboard | `views/HomeView.vue` |
| Filter by type | `views/FilterTypes.vue` |
| Filter by year | `views/FilterYears.vue` |

---

## Key decisions and gotchas

### ESM compatibility with actioncable
Vite is ESM-only. The original code used `require('actioncable')`, which does not exist in a browser ESM context. Fixed with:
```ts
import * as ActionCable from 'actioncable'
```

### PostCSS config conflict
Vite automatically picks up any `.postcssrc.yml` in the project root. The file left over from Shakapacker used `js-yaml` v3 syntax, causing `yaml.parse is not a function` at build time. Fixed by adding an explicit empty PostCSS config in `vite.config.ts`:
```ts
css: { postcss: {} }
```

### Bootstrap without jQuery
Bootstrap 4's `data-toggle="dropdown"` JavaScript requires jQuery. Since Vue manages the DOM reactively, all dropdowns in the navbar are controlled with a single `openMenu` ref + `toggle()`/`close()` functions — no jQuery needed.

### DELETE returning 204 No Content
Rails returns HTTP 204 for successful DELETE requests (no body). The `fetch` wrapper was always calling `response.json()`, causing an "Unexpected end of JSON input" error. Fixed:
```ts
if (response.status === 204 || response.headers.get('content-length') === '0') {
  return undefined as T
}
return response.json() as Promise<T>
```

### Quarterly balance bug in original Angular code
The original `tableYear` computed quarters as `[1, 2, 3, 4]` and used them as month offsets, producing overlapping windows. Fixed to use the correct quarter start months `[1, 4, 7, 10]`.

### Real-time updates
Angular used `$(document).on('operations.update', handler)` jQuery events. In Vue, the Pinia operations store is reactive: components use `watch(() => store.byYear.get(year), refresh)`. When ActionCable delivers a message, `store.applyUpdate()` mutates the Map and all watchers are notified automatically.

### Note popover
Angular used Bootstrap's jQuery `$(el).popover()`. Replaced with a Vue-managed absolutely-positioned card, toggled by `activeNote = ref<number | null>(null)`.

---

## Files removed

- `app/controllers/angular_controller.rb`
- `app/views/layouts/angular.html.erb`
- `app/javascript/` (entire directory — all Angular source)
- `config/webpack/`
- `babel.config.js`
- `.postcssrc.yml`
- `karma.conf.js`
- `jest.config.js`
- `test/controllers/angular_controller_test.rb`

## Files added (key)

- `app/frontend/entrypoints/application.ts` — Vite entry point
- `app/frontend/stores/auth.ts` — JWT auth (Pinia)
- `app/frontend/stores/operations.ts` — operations cache by year (Pinia)
- `app/frontend/lib/api.ts` — fetch wrapper with Authorization header
- `app/frontend/lib/cable.ts` — ActionCable consumer
- `app/frontend/router/index.ts` — 21 routes
- `app/frontend/utils/operationsGrouping.ts` — grouping/filtering pure functions
- `app/frontend/utils/chartData.ts` — chart dataset builder
- `app/views/layouts/vue.html.erb` — minimal HTML shell with `<div id="app">`
- `app/controllers/vue_controller.rb` — serves the SPA for all non-API routes
- `vite.config.ts`
- `test/controllers/vue_controller_test.rb`
