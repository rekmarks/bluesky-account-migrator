#!/bin/bash

set -x
set -e
set -o pipefail

# For some reason esbuild imports vi from vitest. This blows up, so we remove it.
function remove_vitest_imports() {
  local tmpfile
  local file="$1"
  tmpfile=$(mktemp)
  sed '/import.*vi.*from.*vitest.*/d' "$file" > "$tmpfile"
  mv "$tmpfile" "$file"
}

args=(--bundle --format=esm --target=es2022 --platform=node --packages=external)
credentials_file="./dist/commands/migrate/credentials.mjs"
operations_file="./dist/migration/operations/index.mjs"
prompts_file="./dist/commands/migrate/prompts.mjs"

pnpm esbuild ./test/mocks/credentials.ts --outfile="$credentials_file" "${args[@]}"
remove_vitest_imports "$credentials_file"

pnpm esbuild ./test/mocks/operations.ts --outfile="$operations_file" "${args[@]}"
remove_vitest_imports "$operations_file"

pnpm esbuild ./test/mocks/prompts.ts --outfile="$prompts_file" "${args[@]}"
remove_vitest_imports "$prompts_file"
