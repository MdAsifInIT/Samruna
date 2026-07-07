# Q&A

## Q1: Can you tell me what does backend do in the project. What are it's roles?
**A:** The backend serves as a local, demo-grade engine designed to power the frontend safely. Its primary roles include:
- **Local API and Persistence:** Provides a lightweight Node.js backend (`/api`) and a local SQLite database.
- **State & Artifact Management:** Persists workflows, proposals, governance records, and audit events.
- **Data Seeding:** Generates realistic, synthetic organization data for the demo without using real customer data.
- **Safe Simulation Boundary:** Ensures execution remains in a safe sandbox, intentionally avoiding live connections to real enterprise systems.
- **Demo Lifecycle:** Provides deterministic routes to reset, export, and import data for consistent demos.

## Q2: I do not really see how this product pitches for hackathon.
**A:** Samruna is designed to be a highly effective hackathon project by combining a strong enterprise narrative with a bulletproof demo:
- **The Problem:** It addresses the real-world pain point of fragmented enterprise operations and manual handoffs.
- **The Story:** It provides a highly visual "before and after" workspace showing messy traces turned into a structured graph, AI identifying bottlenecks, and generating a governed automation proposal.
- **Reliability:** It is deterministic, local-first (SQLite), and executes in "safe simulation mode." It also features a "Historical Validation Engine" to serve as a reliable fallback if live OpenAI API calls fail during judging.

## Q3: I do not see actual thing implemented, what is the frontend backend integration, where does openai come into play. All these are ambiguous.
**A:** The implementation is strictly separated to keep complex parts hidden and secure:
- **Frontend-Backend Integration:** The frontend uses an API client (`src/app/apiClient.ts`) with standard `fetch` wrappers. The main controller (`src/app/useWorkGraphDemoController.ts`) binds UI actions to these API calls. The backend (`server/index.ts`) is a Node HTTP server that receives these requests and delegates them to a WorkspaceService.
- **OpenAI Integration:** OpenAI is strictly isolated to the backend to prevent API key leaks to the browser. The backend reads `OPENAI_API_KEY` (`server/ai.ts`) and makes the actual request to OpenAI's API in `src/ai/providers.ts` (`OpenAiResponsesProvider`). The frontend never sees the key or the raw call; it only receives a safe status object indicating if the AI generation succeeded or fell back to the validation engine.

## Q4: What does ai do here in the backend? What work does it handle?
**A:** The AI acts purely as a **Workflow Automation Planner / Proposal Generator**.
- **What it does:** It takes deterministically analyzed context (work patterns, graph metrics, policies, bottlenecks) and generates a structured JSON blueprint (a "Proposal"). This proposal dictates the trigger, required data, eligibility rules, actions, and escalations for automating a process.
- **What it does NOT do:** It does NOT execute actions, make unilateral decisions (a human must approve the proposal), or analyze the raw data logs.

## Q5: Where does the evidence view show?
**A:** The Evidence view is accessible directly from the main workspace navigation menu. It is one of the five primary tabs/links in the dashboard, alongside **Overview**, **Graph**, **Review & Run**, and **Audit**. When you are inside the main dashboard (after launching the app and loading a workflow), you can click on the "Evidence" tab (represented by an eye icon) to view the raw traces and source data.

## Q6: What still needs to be implemented in this project?
**A:** While the core MVP and local demo are complete, the documentation (`docs/07-roadmap.md` and `docs/08-continuation-plan.md`) outlines two main categories of work remaining:
1. **Near-Term UI & QA Improvements:**
   - Expanding end-to-end testing (mobile viewports, edge cases, accessibility checks).
   - Adding CI pipelines for automated testing and auditing.
   - Developing a richer, interactive visual canvas for the Graph view.
   - Adding more workflow scenarios (like Employee Onboarding, Incident Triage, or Finance Exceptions).
2. **Production-Ready Features (Currently out of scope for the demo):**
   - **Authentication & RBAC:** Securing the app and managing user roles.
   - **Real Enterprise Connectors:** Replacing synthetic data with live connections to ticketing, email, HR, and chat systems.
   - **Live Execution:** Moving from "safe simulation mode" to actual provisioning and system mutation.
   - **Production Infrastructure:** Upgrading from local SQLite to durable storage and immutable audit logs.
   - **Hardened AI Integration:** Adding model observability, evaluations, and red-teaming for the server-side OpenAI calls.

## Q7: How can this solution be implemented with any organization?
**A:** To deploy this in a real enterprise (moving beyond the current local MVP), the architecture must evolve to integrate securely with the organization's existing systems. According to the architecture and security docs, this requires:
1. **Data Ingestion via Connectors:** Instead of synthetic demo data, the system needs scoped, read-only connectors to enterprise tools (Jira, ServiceNow, Slack, Email, HR systems) to observe real work traces. It does not need unrestricted access, just enough provenance (timestamps, approvals, status changes) to reconstruct the process graph.
2. **Security & Identity (RBAC):** Implementation of SSO (Single Sign-On) and Role-Based Access Control so that only authorized personnel (e.g., IT Managers, Compliance Officers) can approve the AI's automation proposals.
3. **Execution & Tool Allowlists:** Transitioning from "safe simulation" to real provisioning. This involves building a secure execution service with strict tool allowlists (e.g., a specific script to create a user in Active Directory) that only fires *after* governance approval is logged.
4. **Production Infrastructure:** Upgrading the backend to use production-grade durable databases (for traces/graphs) and immutable storage (for audit logs) rather than local SQLite.
5. **AI Safety & Observability:** Hardening the backend OpenAI integration with robust monitoring for model drift, logging of model-influenced decisions, and strict data retention policies.

## Q8: What data is needed from an organization for implementation of this tool? Would the data be safe?
**A:** According to the "Data Access And Security" documentation (`docs/05-data-access-and-security.md`), the system requires only narrowly scoped data, and it is explicitly designed to keep that data safe.

**Data it NEEDS:**
It only needs "scoped work-trace data with provenance" to reconstruct process flows. This includes:
- Ticket records and statuses
- Email/Chat metadata (timestamps, senders, receivers) or explicitly *approved* excerpts
- Approval logs and task events
- Employee roles and identities (to verify who approved what)
- Policy catalogs and audit events

**Data it explicitly DOES NOT NEED:**
- Passwords or API Keys
- Customer production data
- Unrestricted access to employee private inboxes or full chat histories
- Financial records or sensitive HR personnel files
- Broad write access to enterprise systems

**Is the data safe?**
Yes, the architectural design ensures safety through several core principles:
- **Least Privilege:** Connectors are given the absolute minimum read-only permissions required to see status changes.
- **Governance Gates:** The AI cannot unilaterally mutate data or execute actions. Every proposed automation requires a strict human-in-the-loop approval.
- **Anonymized AI Prompts:** The data sent to the AI (like OpenAI) is heavily summarized graph metrics, bottleneck identifiers, and policies, not the raw PII from an employee's inbox. Additionally, the backend sets the OpenAI API to `store: false` to ensure data isn't used for training.
- **Retention Controls:** A production deployment requires source-specific retention rules, ensuring data is only held long enough to prove the audit trail and is then discarded.
