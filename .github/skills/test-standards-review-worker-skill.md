---
name: code-review-worker
description: 'Reviews MR changes by comparing a source branch against main, produces an evidence-backed review report, and invokes test standards review when automated tests are changed.'
---

# Code Review Worker

Summarizes and evaluates merge request changes between branches with a focus on correctness, risk, and readiness.

## When to Use This Skill

- User asks for MR/PR review between a source branch and `main`
- Need prioritized findings with severity and evidence
- Need a review decision (`approve`, `approve-with-comments`, `request-changes`)

## Inputs

- `source_branch` (required)
- `target_branch` (optional, default `main`)
- `review_scope` (optional: `all`, `changed-files-only`, `tests-only`)
- `focus_areas` (optional)

## What It Does

1. Computes branch diff (`target_branch` vs `source_branch`)
2. Classifies changed files (source, tests, config/docs)
3. Reviews for logic defects, brittleness, risky assumptions
4. Invokes internal test review worker when test files are changed or test-only scope is requested
5. Produces a concise evidence-backed output

## Output Shape

- **Summary**
- **Findings** (High/Medium/Low)
- **Evidence** (file + line + snippet)
- **Suggested Fix**
- **Test Coverage Notes**
- **Decision**

## Constraints

- No speculative findings
- Every finding must cite direct evidence from diff
- Skip internal test worker if no automated tests changed
