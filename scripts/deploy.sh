#!/usr/bin/env bash
# Build the site and publish dist/ to the gh-pages branch (served by GitHub Pages).
set -euo pipefail
cd "$(dirname "$0")/.."
remote_url="$(git remote get-url origin)"
npm run build
touch dist/.nojekyll
cd dist
rm -rf .git
git init -q -b gh-pages
git add -A
git commit -q -m "Deploy $(git -C .. rev-parse --short HEAD)"
# Authenticate with the GitHub CLI login so this works without SSH keys.
git -c credential.helper= -c credential.helper="!gh auth git-credential" push -f "$remote_url" gh-pages
rm -rf .git
