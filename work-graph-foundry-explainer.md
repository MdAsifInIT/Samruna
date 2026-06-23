# Work Graph Foundry Explainer

**Work Graph Foundry turns messy enterprise work into a living map, then uses AI agents to convert repeatable patterns into governed automation.**

## Simple Explanation

Work Graph Foundry is a control tower for company work.

In a large company, work moves through emails, chat messages, tickets, spreadsheets, approvals, PDFs, and internal systems. Nobody has a perfect view of how work actually gets done. Work Graph Foundry watches those work trails, learns the real process, finds repeated patterns, and helps build automations with human approval.

It does not just answer questions. It observes, reasons, plans, executes, and improves.

## Real-World Analogy

Imagine a city with traffic everywhere but no traffic map. Cars are moving, people are waiting, some roads are blocked, and nobody knows the true bottlenecks.

Work Graph Foundry is like installing a live traffic system for the enterprise. It sees where work starts, where it gets stuck, who needs to approve it, what rules apply, and which routes are repeated every day. Then it suggests better routes and can create controlled fast lanes for routine work.

## The Enterprise Problem

Enterprises waste huge time on invisible coordination:

- People repeat the same approval steps manually.
- Teams rely on tribal knowledge.
- Processes differ by person, region, or department.
- Chatbots can answer questions, but they do not understand the whole workflow.
- Automation tools need humans to define the workflow first.
- Leaders cannot easily see which work patterns should be automated.

The real pain is not just too many tasks. It is that companies do not have a live operating model of how work actually moves.

## How It Works

1. **Observe:** Connect to work sources such as tickets, emails, documents, chat threads, forms, and approval logs.

2. **Understand:** Identify recurring work patterns like access requests, procurement approvals, onboarding, vendor reviews, or finance exceptions.

3. **Map:** Build a work graph showing actors, steps, dependencies, systems, rules, approvals, exceptions, and outcomes.

4. **Reason:** Decide which patterns are good candidates for automation based on volume, repeatability, risk, bottlenecks, and policy sensitivity.

5. **Plan:** Generate a proposed workflow: what data is needed, what rules apply, who approves, what system action happens, and when to escalate to a human.

6. **Simulate:** Test the proposed automation against past examples to see whether it would have made the right decisions.

7. **Execute With Governance:** Let process owners approve the automation before it goes live.

8. **Improve:** Learn from failures, overrides, delays, and new exceptions, then recommend workflow updates.

## Why It Is Better Than A Chatbot Or Basic Automation

A normal chatbot helps one person answer one question.

A basic automation tool runs a workflow someone already designed.

Work Graph Foundry is different because it discovers the workflow first. It looks across many examples, learns the real process, finds bottlenecks, proposes automation, validates it, and improves over time. That makes it a system for enterprise learning, not just task completion.

## OpenAI Stack Usage

### ChatGPT Enterprise

ChatGPT Enterprise is the human collaboration and governance layer. Process owners, compliance teams, IT, finance, and operations leaders can review discovered workflows, ask questions, approve automations, and interact with company data in a secure enterprise environment.

### OpenAI API / Responses API

The OpenAI API and Responses API power the agentic engine. They classify work items, extract structured fields, detect patterns, reason over process steps, call tools, generate workflow specs, and keep multi-step context.

This is where the observe, reason, plan, execute, and improve loop lives.

### Codex

Codex is the builder layer. It helps the team rapidly create connectors, prototype the dashboard, generate workflow code, write tests, review edge cases, and turn AI-generated workflow plans into working software.

## Hackathon MVP

Build a focused demo around one enterprise workflow, such as employee access requests.

The MVP could show:

- A sample dataset of 50 to 100 historical requests.
- AI clustering similar requests into patterns.
- A visual work graph: requester to manager approval to policy check to IT provisioning to audit log.
- A bottleneck insight: "70% of delays happen at manager approval."
- An AI-generated workflow proposal.
- A simulation showing how the workflow would have handled past requests.
- A human approval screen.
- A final automation run on a new request.

The key demo moment: the system does not start with a predefined workflow. It discovers the workflow from real work traces.

## Enterprise Examples

### IT Access Management

Detect repeated access requests, map approvals, check policies, generate provisioning workflows, and escalate exceptions.

### Procurement

Learn how vendor requests move through finance, legal, compliance, and business teams, then automate low-risk approvals while routing risky cases to humans.

### Employee Onboarding

Observe onboarding tasks across HR, IT, facilities, security, and payroll, then create a governed workflow that adapts by role, location, and seniority.

## Business Value

Work Graph Foundry creates value by reducing manual coordination, shortening cycle times, improving compliance, making processes consistent, and turning hidden operational knowledge into reusable automation.

Judges would like it because it is not a toy chatbot. It has a clear enterprise pain, a strong agentic loop, a believable MVP, and a bigger product vision: an AI-native operating layer that helps companies understand and improve how work actually happens.

## Polished Pitch Statement

Work Graph Foundry is an AI-native operating layer for enterprise work. It observes how tasks, approvals, documents, and decisions actually move across a company, builds a live work graph, identifies repeatable patterns, and generates governed automations that improve with every run. It helps enterprises move from scattered manual coordination to intelligent, auditable, continuously improving operations.

## Source Notes

- [ChatGPT Enterprise](https://openai.com/chatgpt/enterprise/)
- [OpenAI Responses API](https://developers.openai.com/api/docs/guides/migrate-to-responses)
- [OpenAI Codex](https://developers.openai.com/codex/)
