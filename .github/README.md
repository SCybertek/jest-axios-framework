# .github Workspace Guide

This folder contains reusable agent workers, skills, and instruction assets used for AI-assisted development workflows in this repository.

## Folder Structure

- `agents/`
  - Executable worker definitions (chatagent markdown with frontmatter).
- `skills/`
  - Human-readable capability summaries for each worker.
- `instructions/`
  - Shared instructions and policy-style guidance.
- `promts/`
  - Prompt assets/templates used by workflows (kept as-is per current repo naming).

## Agents

- `code-review-worker.md`
  - Reviews MR changes by comparing source branch against `main`.
  - Invokes internal test standards worker when test files are changed.
- `e2e-gherkin-coordinator-worker.md`
  - Coordinator that converts Epic/Feature tickets into E2E-only Gherkin plans.
  - Uses internal workers for ticket context extraction and E2E coverage scan.
- `e2e-ticket-context-extractor-worker.md`
  - Internal worker that extracts structured requirements from Jira/Confluence context.
- `e2e-coverage-scan-worker.md`
  - Internal worker that scans `tests/e2e/**` coverage and reports gaps with evidence.
- `test-standards-review-worker.md`
  - Internal subagent focused on automated test standards compliance.
- `test-case-creation-agent.md`
  - Generates positive/negative/edge API tests from generated clients.

## Skills

- `code-review-worker-skill.md`
  - Usage and scope summary for MR review worker.
- `e2e-gherkin-coordinator-worker-skill.md`
  - Usage and scope summary for E2E Gherkin coordinator workflow.
- `e2e-ticket-context-extractor-worker-skill.md`
  - Usage and scope summary for ticket context extraction worker.
- `e2e-coverage-scan-worker-skill.md`
  - Usage and scope summary for E2E coverage scanning worker.
- `test-standards-review-worker-skill.md`
  - Usage and scope summary for internal test standards reviewer.
- `test-case-creation-worker-skill.md`
  - Usage and scope summary for generated API test creation worker.

## Agent ↔ Skill Mapping

- `agents/code-review-worker.md` → `skills/code-review-worker-skill.md`
- `agents/e2e-gherkin-coordinator-worker.md` → `skills/e2e-gherkin-coordinator-worker-skill.md`
- `agents/e2e-ticket-context-extractor-worker.md` → `skills/e2e-ticket-context-extractor-worker-skill.md`
- `agents/e2e-coverage-scan-worker.md` → `skills/e2e-coverage-scan-worker-skill.md`
- `agents/test-standards-review-worker.md` → `skills/test-standards-review-worker-skill.md`
- `agents/test-case-creation-agent.md` → `skills/test-case-creation-worker-skill.md`

## Conventions

- Keep each `agent` narrowly scoped and execution-oriented.
- Keep each `skill` concise and discoverability-oriented (when to use, inputs, outputs, constraints).
- Prefer evidence-backed findings for review-style agents.
- Keep internal-only workers with `user-invokable: false` in agent frontmatter.
- Avoid unsupported tool names in agent frontmatter.

## Maintenance Checklist

When adding a new worker:

1. Add agent file under `agents/` with valid frontmatter.
2. Add matching skill file under `skills/`.
3. Update this README with:
   - new agent summary
   - new skill summary
   - mapping entry
4. Validate tool names supported by your runtime.

## Notes

- Branch-diff review behavior depends on branch availability in local git context.
- For repositories with inconsistent API behavior, prefer resilient assertions in generated tests.
