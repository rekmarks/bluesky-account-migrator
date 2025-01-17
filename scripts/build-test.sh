#!/bin/bash

set -x
set -e
set -o pipefail

args=(--bundle --format=esm --target=es2022 --platform=node --packages=external)
credentials_file="./dist/commands/migrate/credentials.mjs"

pnpm esbuild ./test/mocks/credentials.ts --outfile="$credentials_file" "${args[@]}"
# For some reason esbuild imports vi from vitest. This blows up, so we remove it.
tmpfile=$(mktemp)
sed '/import.*vi.*from.*vitest.*/d' "$credentials_file" > "$tmpfile"
mv "$tmpfile" "$credentials_file"

pnpm esbuild ./test/mocks/operations.ts --outfile=./dist/migration/operations/index.mjs "${args[@]}"

pnpm esbuild ./test/mocks/prompts.ts --outfile=./dist/commands/migrate/prompts.mjs "${args[@]}"
