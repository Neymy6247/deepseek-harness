#!/bin/sh
# Vendoring discipline, mechanized: any staged change under vendor/*/src or a
# vendored bin.js must come with a vendor/README.md change in the same commit
# (the manifest's local-modification log is the contract — see vendor/README.md).
set -eu

vendor_src=':(glob)vendor/*/src/**'
vendor_bin=':(glob)vendor/*/bin.js'

if git diff --cached --quiet -- "$vendor_src" "$vendor_bin"; then
  exit 0
else
  diff_status=$?
  [ "$diff_status" -eq 1 ] || exit "$diff_status"
fi

if git diff --cached --quiet -- vendor/README.md; then
  vendor_src_changed=$(git diff --cached --name-only -- "$vendor_src" "$vendor_bin")
  echo 'vendor manifest guard: vendored SOURCE changed without updating vendor/README.md:'
  printf '%s\n' "$vendor_src_changed" | while IFS= read -r path; do
    printf '  %s\n' "$path"
  done
  echo 'Log the modification in vendor/README.md ("Local modifications") and stage it.'
  exit 1
else
  diff_status=$?
  [ "$diff_status" -eq 1 ] || exit "$diff_status"
fi
