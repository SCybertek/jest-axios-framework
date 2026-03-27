---
name: test-case-creation-worker
description: 'Generates positive, negative, and edge API test cases from Orval-generated clients and writes executable Jest + TypeScript suites under tests/api.'
---

# Test Case Creation Worker

Generates robust API test suites from generated clients with balanced positive/negative/edge coverage.

## When to Use This Skill

- User asks to generate API tests for generated client modules
- Need quick baseline coverage for endpoint operations
- Need consistent test naming and cleanup patterns

## Inputs

- Generated client file path (for example `src/gen/clients/pet/pet.ts`)
- Optional operation filters
- Optional max test count
- Optional include/exclude destructive scenarios

## What It Does

1. Reads exported operations from generated client module
2. Builds positive/negative/edge scenario matrix
3. Creates/updates `tests/api/<domain>-generated.test.ts`
4. Uses deterministic data generation and cleanup strategy
5. Uses resilient assertions for variable public API responses

## Output Shape

- Test file path created/updated
- Operations covered
- Case counts by category
- Assumptions/caveats on API behavior

## Optional Internal Planner

Supports an internal planner mode for larger requests (multi-module or >15 tests) to propose coverage matrix and assertion normalization before file generation.

## Constraints

- Never modify generated code under `src/gen/**`
- Avoid secrets and non-deterministic patterns
- Keep assertions meaningful and evidence-driven
