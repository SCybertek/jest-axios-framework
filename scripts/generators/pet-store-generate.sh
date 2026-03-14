#!/usr/bin/env bash
# Petstore API Generator Script
# Downloads swagger JSON, converts to YAML, and generates orval stubs

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
OPENAPI_DIR="${PROJECT_ROOT}/src/gen/openapi/petstore"
OUTPUT_YAML="${OPENAPI_DIR}/petstore-openapi.yml"
ORVAL_CONFIG="${SCRIPT_DIR}/orval-config/orval.petstore.config.ts"

# Create directory if it doesn't exist
mkdir -p "$OPENAPI_DIR"
mkdir -p "${PROJECT_ROOT}/src/gen/clients"

# 1. Download swagger JSON from Petstore API
echo "[info] Downloading Petstore swagger JSON"
curl -fsSL -o "${OPENAPI_DIR}/petstore-swagger.json" "https://petstore.swagger.io/v2/swagger.json"

# Check if download was successful
if [[ ! -s "${OPENAPI_DIR}/petstore-swagger.json" ]]; then
echo "Failed to download swagger JSON" >&2
exit 1
fi

# 2. Convert JSON Swagger to YAML OpenAPI
echo "[info] Converting JSON to YAML"
npx swagger2openapi "${OPENAPI_DIR}/petstore-swagger.json" -o "$OUTPUT_YAML" --targetVersion 3.1.1 --patch --yaml --resolveInternal

# Check if conversion was successful
if [[ ! -f "$OUTPUT_YAML" ]]; then
echo "Failed to convert JSON to YAML" >&2
exit 1
fi

# 3. Clean up the YAML (optional, based on existing script)
echo "[info] Cleaning up YAML"
# Remove carriage returns
perl -pi -e 's/\r//g; s/\\r\\n/\\n/g; s/\\r//g' "$OUTPUT_YAML"

# Remove empty paths
# yq -i 'del(.paths[] | select(length == 0))' "$OUTPUT_YAML"

# 4. Generate orval stubs
echo "[info] Generating orval stubs"
if [[ ! -f "$ORVAL_CONFIG" ]]; then
echo "Orval config not found: $ORVAL_CONFIG" >&2
exit 1
fi

# Run orval
npx orval --config "$ORVAL_CONFIG"

echo "[info] Petstore API generation complete"
