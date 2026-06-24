import { describe, expect, it } from "vitest";
import { loadDemoFixtures } from "./fixtures";
import { buildWorkGraph } from "./graph";
import { createGovernanceRecord, auditFromGovernance, canExecute, createAuditEvent } from "./governance";
import { ingestWorkTraces } from "./ingestion";
import { detectWorkPatterns } from "./patterns";
import { generateAutomationProposal } from "./planner";
import { simulateAutomation } from "./simulation";

function makeProposal() {
  const fixtures = loadDemoFixtures();
  const ingestion = ingestWorkTraces(fixtures.rawTraces, fixtures.approvalHistory);
  const detection = detectWorkPatterns(ingestion.items);
  const pattern = detection.patterns[0];

  if (!pattern) {
    throw new Error("Expected a top pattern");
  }

  const graph = buildWorkGraph(ingestion.items, pattern.id);
  const bottleneck = detection.bottlenecks.find((item) => item.patternId === pattern.id);
  const opportunity = detection.opportunities.find((item) => item.patternId === pattern.id);

  if (!bottleneck || !opportunity) {
    throw new Error("Expected bottleneck and opportunity");
  }

  return {
    proposal: generateAutomationProposal({
      pattern,
      graph,
      policyRules: fixtures.policyRules,
      bottleneck,
      opportunity
    }),
    items: ingestion.items
  };
}

describe("simulation and governance", () => {
  it("replays historical cases against a proposal", () => {
    const { proposal, items } = makeProposal();
    const result = simulateAutomation(proposal, items);

    expect(result.totalCases).toBe(13);
    expect(result.passed).toBeGreaterThan(0);
    expect(result.needsHuman).toBeGreaterThan(0);
    expect(result.policyRisk).toBeGreaterThan(0);
    expect(result.avoidedDelayHours).toBe(result.passed * 24);
  });

  it("blocks execution until a proposal is approved", () => {
    const { proposal } = makeProposal();
    const pending = createGovernanceRecord({
      proposal,
      decision: "pending",
      reviewerRole: "process_owner",
      comments: "Awaiting compliance review.",
      timestamp: "2026-05-16T10:00:00Z"
    });
    const approved = createGovernanceRecord({
      proposal,
      decision: "approved",
      reviewerRole: "compliance",
      comments: "Approved for low-risk requests with escalation gates.",
      timestamp: "2026-05-16T11:00:00Z"
    });

    expect(canExecute([pending], proposal)).toBe(false);
    expect(canExecute([pending, approved], proposal)).toBe(true);
    expect(auditFromGovernance(approved).action).toBe("Proposal approved");
  });

  it("keeps canExecute false for non-eligible governance records", () => {
    const { proposal } = makeProposal();

    const rejected = createGovernanceRecord({
      proposal,
      decision: "rejected",
      reviewerRole: "compliance",
      comments: "Rejected due to policy risk.",
      timestamp: "2026-05-16T11:00:00Z"
    });
    const changesRequested = createGovernanceRecord({
      proposal,
      decision: "changes_requested",
      reviewerRole: "process_owner",
      comments: "Revise escalation path.",
      timestamp: "2026-05-16T11:15:00Z"
    });
    const wrongProposalId = {
      ...createGovernanceRecord({
        proposal,
        decision: "approved",
        reviewerRole: "compliance",
        comments: "Approved.",
        timestamp: "2026-05-16T11:30:00Z"
      }),
      proposalId: "proposal-other"
    };
    const staleProposalVersion = {
      ...createGovernanceRecord({
        proposal,
        decision: "approved",
        reviewerRole: "compliance",
        comments: "Approved.",
        timestamp: "2026-05-16T11:45:00Z"
      }),
      proposalVersion: proposal.version - 1
    };

    expect(canExecute([rejected], proposal)).toBe(false);
    expect(canExecute([changesRequested], proposal)).toBe(false);
    expect(canExecute([wrongProposalId], proposal)).toBe(false);
    expect(canExecute([staleProposalVersion], proposal)).toBe(false);
  });

  it("creates auditable agent events for non-governance actions", () => {
    const event = createAuditEvent({
      id: "audit-agent-analysis",
      timestamp: "2026-05-16T09:20:00Z",
      actor: "observer_agent",
      action: "Workflow analyzed",
      detail: "Normalized synthetic workflow traces."
    });

    expect(event.actor).toBe("observer_agent");
    expect(event.detail).toMatch(/synthetic workflow traces/i);
  });
});
