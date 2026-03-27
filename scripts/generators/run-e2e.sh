#!/usr/bin/env bash
set -euo pipefail

# Run Jest for E2E tests only
npx jest tests/e2e --runInBand "$@"
