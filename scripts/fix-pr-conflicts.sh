#!/usr/bin/env bash
set -euo pipefail

BASE_BRANCH="${1:-main}"
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

if [[ "$CURRENT_BRANCH" == "$BASE_BRANCH" ]]; then
  echo "You are on '$BASE_BRANCH'. Switch to your feature branch before running this script."
  exit 1
fi

if ! git rev-parse --verify "$BASE_BRANCH" >/dev/null 2>&1; then
  if git ls-remote --exit-code --heads origin "$BASE_BRANCH" >/dev/null 2>&1; then
    git fetch origin "$BASE_BRANCH:$BASE_BRANCH"
  else
    echo "Base branch '$BASE_BRANCH' was not found locally or on origin."
    echo "Pass the correct base branch name as the first argument."
    exit 1
  fi
fi

echo "Checking for a clean working tree..."
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Working tree is not clean. Commit or stash your changes first."
  exit 1
fi

echo "Attempting to rebase '$CURRENT_BRANCH' onto '$BASE_BRANCH'..."
if git rebase "$BASE_BRANCH"; then
  echo "Rebase successful. Push your branch with:"
  echo "  git push --force-with-lease"
  exit 0
fi

echo

echo "Rebase stopped due to conflicts. Resolve each conflicted file, then run:"
echo "  git add <resolved-file>"
echo "  git rebase --continue"
echo
echo "If you need to stop and return to the previous state:"
echo "  git rebase --abort"
exit 1
