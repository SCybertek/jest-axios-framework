---
name: e2e-coverage-scan-worker
description: 'Internal skill that scans tests/e2e coverage and reports covered, partial, and missing journeys with evidence references.'
---

# E2E Coverage Scan Worker

Internal coverage-audit skill used by the coordinator to avoid duplicate E2E scenarios and highlight gaps.

## When to Use This Skill

- Existing E2E tests must be considered before planning new scenarios
- Need evidence-backed gap analysis for journey coverage

## Output Highlights

- Files scanned
- Covered/partial/missing journeys
- Evidence references and risks

## Constraints

- No speculative coverage claims
- Evidence-first reporting
