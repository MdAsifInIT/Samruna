# 7. Roadmap

## 7.1 Current Limitations

The MVP is intentionally scoped. Current limitations:

- no backend API
- no database
- no authentication
- no role-based access control
- no live enterprise connectors
- no real provisioning
- no server-side OpenAI call path
- no durable server-side audit history
- no richer visual graph canvas beyond the current selectable graph/pattern inspection
- limited browser automation coverage beyond the current Chromium golden path

These limitations are acceptable for a local-first demo but should be addressed before production use.

## 7.2 Near-Term Local POC Needs

Recommended local POC improvements:

1. Stabilize graph node and edge identifiers so graph views, exported summaries, and future visual layouts can compare runs reliably.
2. Expand Playwright e2e beyond the current Chromium golden path.
3. Add mobile viewport e2e coverage for the full demo path.
4. Add accessibility checks for keyboard navigation, labels, focus order, and contrast.
5. Add CI coverage for typecheck, unit tests, build, audit, and Playwright.
6. Add richer proposal versioning and comparison.
7. Add a richer visual graph canvas.
8. Add more workflow templates.
9. Add dataset import beyond the current run-summary import/export.

## 7.3 Production-Only Roadmap

Production-ready next steps:

1. Add a server-side API layer for live OpenAI calls.
2. Add durable server-side storage for traces, proposals, simulations, governance records, execution runs, and audit events.
3. Add authentication and role-based access control.
4. Add connector framework for enterprise systems.
5. Add observability for model calls and execution outcomes.

## 7.4 Server-Side OpenAI Integration

A production-ready OpenAI integration should:

- live outside browser code
- own `OPENAI_API_KEY` securely
- call the Responses API
- validate structured output
- log model-influenced decisions
- fall back to mock output on failure

This can start with a small API route for proposal generation.

## 7.5 Enterprise Connector Roadmap

Potential connectors:

- ticketing systems
- email systems
- chat systems
- identity providers
- HR systems
- provisioning tools
- document repositories
- audit systems

Connector principles:

- least privilege
- scoped sync
- provenance preservation
- source-specific retention
- no write actions without approval

## 7.6 Workflow Expansion

Implemented local scenarios:

- IT access requests
- Procurement intake

Good next workflows:

### 7.6.1 Employee Onboarding

Flow:

- HR trigger
- IT access
- device provisioning
- payroll setup
- security training

Why it fits:

- cross-functional
- graph-friendly
- clear orchestration value

### 7.6.2 Incident Triage

Flow:

- alert intake
- severity classification
- owner assignment
- customer communication
- remediation tracking

Why it fits:

- time-sensitive
- strong escalation model
- clear human-review boundary

### 7.6.3 Finance Exceptions

Flow:

- invoice exception
- missing purchase order
- manager review
- finance approval
- audit note

Why it fits:

- measurable delays
- strong governance requirements
- clear human-review lane

## 7.7 Productionization Path

Suggested order:

1. Harden the local demo with expanded e2e, mobile, accessibility, and CI checks.
2. Stabilize graph identifiers and add proposal versions.
3. Add a richer graph visualization that preserves provenance and bottleneck inspection.
4. Add server-side API.
5. Add database.
6. Add authentication.
7. Add RBAC.
8. Add OpenAI server route.
9. Add connector ingestion.
10. Add persisted audit events.
11. Add tool execution allowlists.
12. Add deployment configuration.

## 7.8 Security Roadmap

Security work should include:

- secret management
- audit immutability
- scoped connector permissions
- data retention controls
- model input/output logging
- approval policies by risk level
- secure tool execution
- incident review for failed automations

## 7.9 Testing Roadmap

Add:

- more Playwright flows for scenario switching, import/export, reset recovery, governance rejection, and execution gating
- mobile viewport Playwright coverage
- accessibility checks in local and CI verification
- CI jobs for `npm run typecheck`, `npm test`, `npm run build`, `npm audit --audit-level=low`, and `npm run test:e2e`
- imported fixture schema tests
- provider fallback tests
- connector contract tests
- server route tests
- visual regression checks for the dashboard

Current browser command:

```powershell
npm run test:e2e
```

Install Chromium first if needed:

```powershell
npm run test:e2e:install
```

Use `npm run test:e2e:preview` for the preview-backed Playwright path and `npm run typecheck:e2e` when validating the e2e TypeScript project.

Sandboxed environments may require explicit permission to install browsers or launch Chromium.

## 7.10 Definition Of Production Readiness

The product is production-ready only when:

- real connectors are scoped and audited
- secrets are server-side only
- audit events persist immutably
- RBAC protects proposal approval and execution
- tool actions are allowlisted
- high-risk cases require human review
- model output is validated
- monitoring captures failures and overrides
- deployment and rollback are documented
