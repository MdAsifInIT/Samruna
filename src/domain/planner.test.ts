import { describe, expect, it } from "vitest";
import { loadDemoFixtures } from "./fixtures";
import { buildWorkGraph } from "./graph";
import { ingestWorkTraces } from "./ingestion";
import { detectWorkPatterns } from "./patterns";
import { generateAutomationProposal } from "./planner";

describe("generateAutomationProposal", () => {
  it("generates a governed automation proposal for the top pattern", () => {
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
      throw new Error("Expected bottleneck and opportunity for top pattern");
    }

    const proposal = generateAutomationProposal({
      pattern,
      graph,
      policyRules: fixtures.policyRules,
      bottleneck,
      opportunity,
      version: 3,
      changeSummary: "Tighten exception routing.",
      generatedAt: "2026-05-16T10:20:00.000Z"
    });

    expect(proposal.id).toBe(`proposal-${pattern.id}-v3`);
    expect(proposal.patternId).toBe(pattern.id);
    expect(proposal.version).toBe(3);
    expect(proposal.changeSummary).toBe("Tighten exception routing.");
    expect(proposal.generatedAt).toBe("2026-05-16T10:20:00.000Z");
    expect(proposal.eligibilityRules).toContain("Requester has active employee status");
    expect(proposal.actions).toContain("Write immutable audit event");
    expect(proposal.confidence).toBeGreaterThan(0.5);
    expect(proposal.auditRationale).toMatch(/repeatability/i);
  });

  it("keeps policy-sensitive patterns under human governance", () => {
    const fixtures = loadDemoFixtures();
    const ingestion = ingestWorkTraces(fixtures.rawTraces, fixtures.approvalHistory);
    const detection = detectWorkPatterns(ingestion.items);
    const pattern = detection.patterns.find((item) => item.id === "pattern-finance_system_access");

    if (!pattern) {
      throw new Error("Expected finance pattern");
    }

    const graph = buildWorkGraph(ingestion.items, pattern.id);
    const bottleneck = detection.bottlenecks.find((item) => item.patternId === pattern?.id);
    const opportunity = detection.opportunities.find((item) => item.patternId === pattern?.id);

    if (!bottleneck || !opportunity) {
      throw new Error("Expected finance pattern bottleneck and opportunity");
    }

    const proposal = generateAutomationProposal({
      pattern,
      graph,
      policyRules: fixtures.policyRules,
      bottleneck,
      opportunity
    });

    expect(proposal.riskLevel).toBe("medium");
    expect(proposal.eligibilityRules).toContain("Policy-sensitive requests route to human review before provisioning");
    expect(proposal.escalations).toContain("Hold provisioning until reviewer approval is recorded");
  });
});
