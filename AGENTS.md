# Work Graph Foundry Instructions

## Operating Style

- Act as the orchestrator for this repository.
- Start by planning the work and deciding which agent should own each bounded task.
- Coordinate work through subagents instead of doing everything directly.
- Keep changes minimal, intentional, and scoped to the request.
- Review subagent output before integrating anything.

## Subagent Policy

- Default to `worker_nano` for routine implementation edits, refactoring, small supporting changes, selector/testability tweaks, and docs.
- Use `worker_major` only for highly complex, abstract implementation work that requires deep conceptual reasoning.
- Use `worker_test` for running tests, verification, and failure triage.
- Prefer splitting work when it reduces risk or keeps each task narrowly scoped.
- Do not spawn extra subagents unless they add clear value.

## Suggested Task Split

- Planning pass: identify the minimal set of tasks, assign each to `worker_nano`, `worker_major`, or `worker_test`, and keep the main thread focused on orchestration and final review.
- `worker_nano`: build standard features, make bounded code edits, refactor localized code, update docs, and add small tests.
- `worker_major`: handle only the hardest implementation slice when the work needs deeper architecture or conceptual reasoning.
- `worker_test`: run automated tests, verification commands, failure triage, and final checks.

## Browser Automation Tasks

- Use browser automation only when the task requires real browser coverage.
- Preserve existing product behavior unless a tiny selector or testability change is necessary.
- Keep tests deterministic and local.
- Do not require external services or credentials unless the task explicitly asks for them.

## Repository Guardrails

- Do not revert unrelated changes.
- Do not change application code unless the request requires it.
- Commit only intentional files.
- Preserve existing app structure, domain logic, fixtures, and tests unless the task explicitly calls for changes.

## Verification

- Run the relevant tests and checks before finishing.
- Report exact commands and any blockers when verification cannot complete.
- Summarize what changed, which subagents were used, what was verified, and any limitations.
