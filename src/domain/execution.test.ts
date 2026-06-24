import { describe, expect, it } from "vitest";
import { loadDemoFixtures } from "./fixtures";
import { buildWorkGraph } from "./graph";
import { ingestWorkTraces } from "./ingestion";
import { detectWorkPatterns } from "./patterns";
import { generateAutomationProposal } from "./planner";
import { recommendLearningUpdate, runApprovedWorkflow } from "./execution";
import { simulateAutomation } from "./simulation";

function makeContext() {
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

  const proposal = generateAutomationProposal({
    pattern,
    graph,
    policyRules: fixtures.policyRules,
    bottleneck,
    opportunity
  });

  return {
    fixtures,
    ingestion,
    proposal
  };
}

describe("execution and learning", () => {
  it("blocks execution before approval", () => {
    const { fixtures, proposal } = makeContext();
    const run = runApprovedWorkflow({
      proposal,
      requestTrace: fixtures.newIncomingTrace,
      approved: false
    });

    expect(run.status).toBe("blocked");
    expect(run.mockToolCalls).toHaveLength(0);
  });

  it("runs approved workflow with safe mock tools", () => {
    const { fixtures, proposal } = makeContext();
    const run = runApprovedWorkflow({
      proposal,
      requestTrace: fixtures.newIncomingTrace,
      approved: true
    });

    expect(run.status).toBe("completed");
    expect(run.mockToolCalls.map((call) => call.tool)).toContain("audit-log.write");
    expect(run.mockToolCalls.map((call) => call.tool)).toContain("work-orchestrator.create-task");
  });

  it("recommends learning updates from simulation and execution signals", () => {
    const { fixtures, ingestion, proposal } = makeContext();
    const simulation = simulateAutomation(proposal, ingestion.items);
    const run = runApprovedWorkflow({
      proposal,
      requestTrace: fixtures.newIncomingTrace,
      approved: true
    });
    const recommendation = recommendLearningUpdate({ simulation, execution: run });

    expect(recommendation.recommendation).toMatch(/human-review lane/i);
    expect(recommendation.suggestedProposalChange).toMatch(/exception lane/i);
  });
});
