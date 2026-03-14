# jest-axios-framework
Lightweight API testing/client framework built around Axios, Jest-oriented tracing, and OpenAPI client generation with Orval.
## What this repo contains
- A reusable Axios base client with common HTTP methods in `src/BaseClient.ts`- Runtime request/response/error tracing helpers in `src/commons/utils/logger.ts`- A sample client (`PetStoreClient`) in `src/clients/PetStoreClient.ts`- Generator scripts for downloading Petstore Swagger and producing OpenAPI + generated client stubs
## Project structure
```text.├── package.json├── notes.md├── scripts/│ └── generators/│ ├── pet-store-generate.sh│ ├── petstore-generate.sh│ └── orval-config/│ └── orval.petstore.config.ts└── src/        ├── BaseClient.ts        ├── clients/        │ └── PetStoreClient.ts        ├── commons/        │ └── utils/        │ └── logger.ts        └── gen/                └── openapi/                        └── petstore/                                ├── petstore-openapi.yml                                └── petstore-swagger.json```
## Prerequisites
- Node.js 18+- npm- `curl` and `perl` available on your machine- (Optional) `yq` if using the script variant that cleans empty OpenAPI paths
## Install
```bashnpm installnpm install -g yqnpm install -g orvalnpm install -g swagger2openapi```
## Generate Petstore OpenAPI and client stubs
Preferred script:
```bashbash scripts/generators/pet-store-generate.sh```
Alternative script:
```bashbash scripts/generators/petstore-generate.sh```
Both scripts:
1. Download Swagger JSON from `https://petstore.swagger.io/v2/swagger.json`2. Convert it to YAML (`src/gen/openapi/petstore/petstore-openapi.yml`)3. Run Orval with `scripts/generators/orval-config/orval.petstore.config.ts`
Configured Orval output target is:
```textsrc/gen/clients/petstore.ts```
## Base client behavior
`BaseClient` wraps Axios and provides:
- `get`, `post`, `put`, `delete`, `patch`- Unified response shape: `{ data, status, headers }`- Response/error interceptors that write structured trace lines (NDJSON)- Optional request/response log file output when `JEST_LOG=true`
## Tracing & logging environment variables
Supported variables (from `logger.ts` + `BaseClient.ts`):
- `JEST_AXIOS_TRACE_ENABLED` (default enabled; set `false` to disable)- `JEST_AXIOS_TRACE_FILE` (default: `jest-axios-trace.ndjson`)- `JEST_AXIOS_TRACE_PER_WORKER` (`true` writes per Jest worker file)- `JEST_AXIOS_TRACE_INCLUDE_HEADERS` (`true` to include sanitized headers)- `JEST_AXIOS_TRACE_FIELD_MAX_CHARS` (default: `500`)- `JEST_AXIOS_TRACE_BODY_MAX_CHARS` (default: `3000`)- `JEST_LOG` (`true` enables request/response runtime log file)- `JEST_LOG_FILE` (default: `runtimelog.log`)
## Quick usage example
```tsimport { PetStoreClient } from './src/clients/PetStoreClient'
async function run() {    const client = new PetStoreClient()    const res = await client.get('/pet/findByStatus', {        params: { status: 'available' },    })
    console.log(res.status)    console.log(Array.isArray(res.data))}
run().catch(console.error)```
## Testing status
Current `package.json` test script is a placeholder:
```bashnpm test# -> "Error: no test specified"```
If you plan to run Jest suites, add/update the `test` script and related Jest config.
## License
ISC