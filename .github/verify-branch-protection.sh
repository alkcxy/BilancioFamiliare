#!/bin/bash
set -e

REPO_OWNER="alkcxy"
REPO_NAME="BilancioFamiliare"
BRANCH="master"

echo "Checking branch protection for ${REPO_OWNER}/${REPO_NAME}:${BRANCH}"

if ! command -v gh &>/dev/null; then
  echo "GitHub CLI not found. Install from https://cli.github.com/"
  exit 1
fi

PROTECTION=$(gh api \
  -H "Accept: application/vnd.github+json" \
  "/repos/${REPO_OWNER}/${REPO_NAME}/branches/${BRANCH}/protection" \
  2>/dev/null || echo "NOT_PROTECTED")

if [ "$PROTECTION" = "NOT_PROTECTED" ]; then
  echo "Branch '${BRANCH}' is NOT protected. See BRANCH_PROTECTION.md."
  exit 1
fi

echo "Branch '${BRANCH}' is protected."

REQUIRED_CHECKS=$(echo "$PROTECTION" | jq -r '.required_status_checks.contexts[]?' 2>/dev/null || echo "")
echo "Required checks: ${REQUIRED_CHECKS:-none}"
