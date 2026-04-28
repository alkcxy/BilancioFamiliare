# Playbook: Bootstrap 4 → 5 Upgrade (Rails + any JS framework)

## Purpose

Step-by-step guide for an agent to upgrade Bootstrap 4 to Bootstrap 5 in a Rails project, regardless of the JS framework (AngularJS, Vue, React, plain ERB). Validated on BilancioFamiliare (Rails 8 + Vue 3 + Vite).

---

## Phase 0 — Reconnaissance (read-only)

Run all steps in parallel.

### 0.1 Identify the asset pipeline

| Condition | Tool |
|---|---|
| `package.json` present | npm/yarn — Bootstrap is an npm package |
| `Gemfile` has `bootstrap` gem | gem-based — different path, see note below |
| CDN `<link>` in layout | manual CDN — update the version in the tag |

> **Gem-based Bootstrap:** run `bundle update bootstrap` and update `application.scss` imports if needed. Skip the npm steps below.

### 0.2 Find exact Bootstrap version

```bash
# npm
grep '"bootstrap"' package.json

# gem
grep 'bootstrap' Gemfile
```

### 0.3 Check if Bootstrap JS is used

Search for these patterns across all templates and JS files:

```
data-toggle=
data-dismiss=
data-target=
new Modal(
new Tooltip(
new Dropdown(
$('.modal')
$('[data-toggle
```

**If Bootstrap JS is NOT used:** skip the JS migration section entirely (zero risk).
**If Bootstrap JS IS used:** data attributes must be renamed to `data-bs-*`, jQuery must be removed if present, and initialisation must move to vanilla JS or a wrapper library.

### 0.4 Check jQuery presence

```bash
grep -r "jquery" package.json Gemfile app/ --include="*.js" --include="*.erb" -l
```

Bootstrap 5 drops the jQuery dependency. If jQuery is only used for Bootstrap JS: remove it. If used elsewhere: keep it, but initialize Bootstrap components with vanilla JS.

### 0.5 Enumerate all BS4-only class patterns

Run these searches across your template/component files:

```bash
# Adjust glob to match your stack (*.erb, *.vue, *.jsx, *.html)
FILES="app/**/*.erb app/**/*.vue app/**/*.jsx app/**/*.html"

grep -rn "form-group"       $FILES
grep -rn "control-label"    $FILES
grep -rn "form-horizontal"  $FILES
grep -rn "col-.*-offset-"   $FILES   # e.g. col-sm-offset-2
grep -rn "jumbotron"        $FILES
grep -rn "float-left\|float-right" $FILES
grep -rn "\bml-\|\bmr-"    $FILES   # margin-left/right utilities
grep -rn "badge-"           $FILES   # badge-primary etc.
grep -rn "btn-block"        $FILES
grep -rn "text-left\|text-right" $FILES  # BS5 renamed to text-start/text-end
grep -rn "data-toggle\|data-dismiss\|data-target" $FILES
```

Collect counts per file — this defines the migration scope.

---

## Phase 1 — Install Bootstrap 5

### npm / yarn

```bash
# yarn (preferred if yarn.lock exists)
yarn add bootstrap@^5.3 @popperjs/core@^2

# npm
npm install bootstrap@^5.3 @popperjs/core@^2
```

> `@popperjs/core` is a peer dependency. Install it even if you don't use dropdowns/tooltips, to avoid peer warning noise.

**SSL issues in Docker?** Add before the install command:
```bash
yarn config set strict-ssl false
```

### Gem-based

```ruby
# Gemfile
gem 'bootstrap', '~> 5.3'
```

```bash
bundle update bootstrap
```

Check `application.scss` — the main `@import "bootstrap"` is unchanged, but verify no deprecated partial imports remain.

### Import path (JS bundler)

The import path `bootstrap/dist/css/bootstrap.min.css` is **unchanged** between BS4 and BS5. No modification needed in the entrypoint file.

---

## Phase 2 — Fix breaking CSS classes

Apply these replacements file by file. Use editor replace-all or `sed -i`.

### 2.1 Form layout (highest volume, highest priority)

Bootstrap 5 replaces `form-horizontal` + `form-group` with standard grid rows:

| BS4 | BS5 | Notes |
|---|---|---|
| `<form class="form-horizontal">` | `<form>` | Remove the class entirely |
| `<div class="form-group">` | `<div class="mb-3">` | Simple forms (no col layout) |
| `<div class="form-group mb-3">` | `<div class="row mb-3">` | Horizontal forms with col-sm-* inside |
| `<label class="control-label">` | `<label class="form-label">` | Simple forms |
| `<label class="col-sm-2 control-label">` | `<label class="col-sm-2 col-form-label">` | Horizontal forms — `col-form-label` handles vertical alignment |
| `<select class="form-control">` | `<select class="form-select">` | Optional but semantically correct |

**Rule of thumb:** if the `form-group` div contains `col-sm-*` children, replace with `row mb-3`. If it's a simple wrapper, replace with `mb-3`.

### 2.2 Spacing utilities (RTL transition)

| BS4 | BS5 |
|---|---|
| `ml-*` | `ms-*` (margin-start) |
| `mr-*` | `me-*` (margin-end) |
| `pl-*` | `ps-*` |
| `pr-*` | `pe-*` |
| `ml-auto` | `ms-auto` |
| `mr-auto` | `me-auto` |

### 2.3 Float and text alignment

| BS4 | BS5 |
|---|---|
| `float-left` | `float-start` |
| `float-right` | `float-end` |
| `text-left` | `text-start` |
| `text-right` | `text-end` |

### 2.4 Grid offset

| BS4 | BS5 |
|---|---|
| `col-sm-offset-2` | `offset-sm-2` |
| `col-md-offset-3` | `offset-md-3` |

Pattern: remove `col-` prefix from offset classes.

### 2.5 Removed components

| BS4 class | BS5 replacement |
|---|---|
| `jumbotron` | `<div class="bg-light rounded p-4">` or custom |
| `badge-primary` | `badge bg-primary` |
| `badge-secondary` | `badge bg-secondary` |
| `btn-block` | `d-grid` on wrapper + `w-100` on button |
| `media`, `media-body` | flexbox utilities (`d-flex`, `flex-grow-1`) |
| `form-row` | `row g-2` (gutters moved to row level) |

### 2.6 Bootstrap JS attributes (only if JS components are used)

| BS4 | BS5 |
|---|---|
| `data-toggle="modal"` | `data-bs-toggle="modal"` |
| `data-dismiss="modal"` | `data-bs-dismiss="modal"` |
| `data-target="#id"` | `data-bs-target="#id"` |
| `data-toggle="dropdown"` | `data-bs-toggle="dropdown"` |
| `data-toggle="collapse"` | `data-bs-toggle="collapse"` |
| `data-toggle="tooltip"` | `data-bs-toggle="tooltip"` |

Bootstrap 5 JS must be initialized explicitly (no auto-init via jQuery):
```js
import { Modal } from 'bootstrap'
const modal = new Modal(document.getElementById('myModal'))
```

---

## Phase 3 — Build and verify

### 3.1 Build

```bash
# Vite
node_modules/.bin/vite build

# Webpacker / Shakapacker
bundle exec rails assets:precompile

# esbuild (Rails 7+)
bundle exec rails assets:precompile
```

Zero errors expected. A warning about `@popperjs/core` peer dep is acceptable if Bootstrap JS is not used.

### 3.2 Run tests

```bash
bin/rails test
yarn test   # or npx vitest run / jest
```

### 3.3 Visual smoke test (browser)

Start the server and verify:

| Page | What to look for |
|---|---|
| Login / signup | Form fields aligned, labels visible |
| Main list view | Navbar dropdowns work, spacing correct |
| Any form with multiple fields | Horizontal layout preserved |
| A page that had jumbotron | Background/padding still visible |
| Any table with action buttons | Buttons not shifted (float-end) |
| Mobile breakpoint | Responsive grid still collapses correctly |

---

## Phase 4 — Commit

```bash
git add -p   # review hunks
git commit -m "Upgrade Bootstrap 4 → 5.3

Replace BS4-only patterns: form-group/row, control-label/col-form-label,
form-horizontal removed, jumbotron→bg-light, float-right/ml-/mr-→
float-end/ms-/me-, col-sm-offset-*→offset-sm-*."
```

---

## Common pitfalls

| Pitfall | Symptom | Fix |
|---|---|---|
| `form-group` removed but no `row` added | cols don't align horizontally | Use `row mb-3` when `col-*` children are present |
| `control-label` removed, no replacement | Label loses alignment inside grid | Use `col-form-label` inside `col-*` context |
| `@popperjs/core` missing | Console warning or dropdown crash | `yarn add @popperjs/core@^2` |
| Custom `$form-group-margin-bottom` SCSS var | Build error | Remove — BS5 dropped this variable |
| `$theme-colors` map override | Sass compile error | Use `map.merge()` syntax (BS5 uses Sass modules) |
| `badge-*` classes | Badge renders unstyled | Replace with `badge bg-*` |

---

## Quick reference: sed one-liners

```bash
FILES=$(find app -name "*.erb" -o -name "*.vue" -o -name "*.jsx" | tr '\n' ' ')

perl -pi -e 's/class="form-group mb-3"/class="row mb-3"/g' $FILES
perl -pi -e 's/class="form-group"/class="mb-3"/g' $FILES
perl -pi -e 's/\bcol-sm-2 control-label\b/col-sm-2 col-form-label/g' $FILES
perl -pi -e 's/\bcontrol-label\b/form-label/g' $FILES
perl -pi -e 's/ class="form-horizontal"//g' $FILES
perl -pi -e 's/\bcol-(\w+)-offset-(\d+)\b/offset-$1-$2/g' $FILES
perl -pi -e 's/\bjumbotron\b/bg-light rounded/g' $FILES
perl -pi -e 's/\bfloat-right\b/float-end/g' $FILES
perl -pi -e 's/\bfloat-left\b/float-start/g' $FILES
perl -pi -e 's/\bmr-(\w+)\b/me-$1/g' $FILES
perl -pi -e 's/\bml-(\w+)\b/ms-$1/g' $FILES
perl -pi -e 's/\btext-right\b/text-end/g' $FILES
perl -pi -e 's/\btext-left\b/text-start/g' $FILES
```

> **Always review with `git diff` before committing.** Regex replacements can hit false positives (e.g., `mr-` inside a custom CSS class name or a string literal).
