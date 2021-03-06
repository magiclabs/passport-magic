#!/usr/bin/env bash

echo
echo "Building passport-magic for production."
echo

# Increase memory limit for Node
export NODE_OPTIONS=--max_old_space_size=4096

export NODE_ENV=production

npx tsc -p ./config/tsconfig.lib.json
