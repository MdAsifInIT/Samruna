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
- no interactive graph canvas
- no browser automation test suite

These limitations are acceptable for a local-first demo but should be addressed before production use.

## 7.2 Future Improvements

Recommended next improvements:

1. Add a server-side API layer for live OpenAI calls.
2. Add durable server-side storage for traces, proposals, simulations, governance records, execution runs, and audit events.
3. Add an interactive graph view with selectable nodes and edge details.
4. Add dataset import beyond the current run-summary import/export.
5. Add richer proposal versioning and comparison.
6. Add browser smoke tests.
7. Add more workflow templates.
8. Add authentication and role-based access control.
9. Add connector framework for enterprise systems.
10. Add observability for model calls and execution outcomes.

## 7.3 Server-Side OpenAI Integration

A production-ready OpenAI integration should:

- live outside browser code
- own `OPENAI_API_KEY` securely
- call the Responses API
- validate structured output
- log model-influenced decisions
- fall back to mock output on failure

This can start with a small API route for proposal generation.

## 7.4 Enterprise Connector Roadmap

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

## 7.5 Workflow Expansion

Implemented local scenarios:

- IT access requests
- Procurement intake

Good next workflows:

### 7.5.1 Employee Onboarding

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

### 7.5.2 Incident Triage

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

### 7.5.3 Finance Exceptions

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

## 7.6 Productionization Path

Suggested order:

1. Add server-side API.
2. Add database.
3. Add authentication.
4. Add RBAC.
5. Add OpenAI server route.
6. Add connector ingestion.
7. Add persisted audit events.
8. Add proposal versions.
9. Add tool execution allowlists.
10. Add deployment configuration.

## 7.7 Security Roadmap

Security work should include:

- secret management
- audit immutability
- scoped connector permissions
- data retention controls
- model input/output logging
- approval policies by risk level
- secure tool execution
- incident review for failed automations

## 7.8 Testing Roadmap

Add:

- Playwright or equivalent browser tests
- accessibility checks
- imported fixture schema tests
- provider fallback tests
- connector contract tests
- server route tests
- visual regression checks for the dashboard

## 7.9 Definition Of Production Readiness

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
