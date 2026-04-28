# Branch Protection Configuration

## Setup (Settings → Branches → Add rule → `master`)

- [x] Require a pull request before merging
- [x] Require status checks to pass before merging
  - [x] Require branches to be up to date before merging
  - Required checks: `Run Rails tests` (pr-gate.yml)
- [x] Require conversation resolution before merging
- [x] Do not allow bypassing the above settings

## Secrets required

| Secret | Description |
|---|---|
| `DOCKERHUB_USERNAME` | Docker Hub username (`alkcxy`) |
| `DOCKERHUB_TOKEN` | Docker Hub access token |

Add them at: **Settings → Secrets and variables → Actions → New repository secret**
