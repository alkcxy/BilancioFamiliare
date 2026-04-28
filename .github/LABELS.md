# GitHub Labels Configuration

## Required Labels

### `run-tests`

**Purpose:** Trigger manual test execution on a PR.

- **Color:** `#0E8A16` (green)
- **Label removed automatically** after workflow completes

**When to use:**
- Re-run tests without pushing new commits
- Verify tests pass after a local fix

---

### `build-docker`

**Purpose:** Build and push a Docker image tagged with the branch name.

- **Color:** `#0052CC` (blue)
- **Label removed automatically** after workflow completes

**When to use:**
- Test a branch-specific Docker image before merging
- Deploy to a staging environment from a feature branch

---

## Workflow Separation

| Event | Workflow triggered | Docker tags |
|---|---|---|
| Push to `master` | `docker-build.yml` | `latest`, `master` |
| Push tag `v*` | `docker-build.yml` | semver (`1.0.0`, `1.0`) |
| PR opened/updated | `pr-gate.yml` | none |
| Label `run-tests` on PR | `test.yml` | none |
| Label `build-docker` on PR | `docker-build.yml` | `<branch-name>` |
| Manual dispatch (UI) | `test.yml` | none |
