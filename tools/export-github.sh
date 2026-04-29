#!/usr/bin/env bash
set -euo pipefail

GITHUB_REPO="git@github.com:mrmalte/myworkexperience.git"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
TMP_DIR="$(mktemp -d)"
COMMIT_MSG="${1:-Export $(date +%Y-%m-%d_%H%M)}"

cleanup() {
  echo "Cleaning up $TMP_DIR ..."
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

echo "=== Export to GitHub ==="
echo "Source:  $PROJECT_DIR"
echo "Remote:  $GITHUB_REPO"
echo "Tmp:     $TMP_DIR"
echo ""

# Clone the GitHub repo (with history, so push is a normal fast-forward)
echo "Cloning GitHub repo..."
git clone "$GITHUB_REPO" "$TMP_DIR/repo"

# Sync current project state into the clone
echo "Syncing files..."
rsync -a --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.env*.local' \
  --exclude='out' \
  --exclude='dist' \
  --exclude='build' \
  --exclude='public/content/site-content.json' \
  --exclude='*.tsbuildinfo' \
  --exclude='*.log' \
  --exclude='.DS_Store' \
  --exclude='Thumbs.db' \
  --exclude='.tmp' \
  "$PROJECT_DIR/" "$TMP_DIR/repo/"

# Commit and push
cd "$TMP_DIR/repo"
git add -A

if git diff --cached --quiet; then
  echo "No changes to export."
  exit 0
fi

git commit -m "$COMMIT_MSG"
echo ""
echo "Changes to push:"
git --no-pager log --oneline -1
echo ""

read -p "Push to GitHub? [y/N] " confirm
if [[ "$confirm" =~ ^[Yy]$ ]]; then
  git push
  echo "✓ Exported to GitHub"
else
  echo "Push cancelled."
fi
