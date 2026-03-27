---
name: e2e-gherkin-coordinator-worker
description: 'Creates an E2E-only Gherkin scenario plan from Epic/Feature context, generated API capabilities, and existing E2E coverage. Outputs a report file under reports/.'
---

# E2E Gherkin Coordinator Worker

Builds an E2E journey-focused Gherkin plan without creating executable tests.

## When to Use This Skill

- Need E2E planning from Jira/Confluence ticket context
- Need user-journey scenarios in Gherkin format
- Need traceability from acceptance criteria to APIs and scenarios

## What It Does

1. Extracts structured requirements context via internal ticket-context worker
2. Analyzes available APIs across all `src/gen/clients/**`
3. Scans existing E2E coverage via internal coverage-scan worker
4. Produces a Markdown report with E2E Gherkin scenarios only

## Output File

- `reports/report-test-cases-e2e-[TICKET-KEY].md`

## Constraints

- No direct test implementation
- E2E-only scope
- Explicit assumptions when context is incomplete
