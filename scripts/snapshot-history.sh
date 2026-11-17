#!/usr/bin/env bash
# Rebuild src/versions/snapshots.json from the release commits. Usage: scripts/snapshot-history.sh "0.1.0:<sha> 0.5.0:<sha> ..."
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$PWD"
OUT="$ROOT/src/versions/snapshots.json"
TMP="$(mktemp -d)"
echo '{"versions":[' > "$OUT.tmp"
first=1
for pair in $1; do
  v="${pair%%:*}"; sha="${pair##*:}"
  git worktree add --detach "$TMP/$v" "$sha" >/dev/null 2>&1
  ln -s "$ROOT/node_modules" "$TMP/$v/node_modules"
  snap="$(pnpm exec tsx scripts/snapshot-export.ts "$TMP/$v")"
  [ $first -eq 1 ] || echo ',' >> "$OUT.tmp"
  first=0
  printf '{"version":"%s","commit":"%s","components":%s}' "$v" "${sha:0:7}" "$snap" >> "$OUT.tmp"
  git worktree remove --force "$TMP/$v"
  echo "snapshotted $v ($sha)" >&2
done
echo ']}' >> "$OUT.tmp"
mv "$OUT.tmp" "$OUT"
