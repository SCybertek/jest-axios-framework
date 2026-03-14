# jest-axios-framework
Lightweight API testing/client framework built around Axios, Jest tracing, and OpenAPI client generation with Orval.
## What this repo contains
- Reusable Axios base client in `src/BaseClient.ts`
- Runtime request/response/error tracing helpers in `src/commons/utils/logger.ts`
- Sample handwritten client in `src/clients/PetStoreClient.ts` (kept as-is)
- Generated OpenAPI clients in `src/gen/clients/**`
- One generator script in `scripts/generators/pet-store-generate.sh`
## Project structure
```text
.
├── package.json
├── scripts/
│   └── generators/
│   	├── pet-store-generate.sh
│   	└── orval-config/
│       	└── orval.petstore.config.ts
├── src/
│   ├── BaseClient.ts
│   ├── clients/
│   │   └── PetStoreClient.ts
│   ├── commons/
│   │   └── utils/
│   │   	└── logger.ts
│   └── gen/
│   	├── clients/
│   	└── openapi/
│       	└── petstore/
│           	├── petstore-openapi.yml
│           	└── petstore-swagger.json
└── tests/
```
## Prerequisites
- Node.js 18+
- npm
- `curl` and `perl`
## Install
```bash
npm install
```
## Generate OpenAPI and clients
Run:
```bash
bash scripts/generators/pet-store-generate.sh
```
This script will:
1. Download Swagger JSON from `https://petstore.swagger.io/v2/swagger.json`
2. Convert it to YAML at `src/gen/openapi/petstore/petstore-openapi.yml`
3. Generate Orval clients using `scripts/generators/orval-config/orval.petstore.config.ts`
## Base client behavior
`BaseClient` provides:
- `get`, `post`, `put`, `delete`, `patch`
- Unified response shape: `{ data, status, headers }`
- Axios interceptors for trace logging
## Tracing environment variables
- `JEST_AXIOS_TRACE_ENABLED`
- `JEST_AXIOS_TRACE_FILE`
- `JEST_AXIOS_TRACE_PER_WORKER`
- `JEST_AXIOS_TRACE_INCLUDE_HEADERS`
- `JEST_AXIOS_TRACE_FIELD_MAX_CHARS`
- `JEST_AXIOS_TRACE_BODY_MAX_CHARS`
- `JEST_LOG`
- `JEST_LOG_FILE`
## Tests
```bash
npm test
npm run test:unit
npm run test:api
```
## License
ISC

