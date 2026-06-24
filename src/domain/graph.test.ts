import { describe, expect, it } from "vitest";
import { loadDemoFixtures, loadDemoScenario } from "./fixtures";
import { buildWorkGraph } from "./graph";
import { ingestWorkTraces } from "./ingestion";
import { detectWorkPatterns } from "./patterns";

describe("buildWorkGraph", () => {
  it("builds the access request graph from normalized items", () => {
    const fixtures = loadDemoFixtures();
    const ingestion = ingestWorkTraces(fixtures.rawTraces, fixtures.approvalHistory);
    const detection = detectWorkPatterns(ingestion.items);
    const topPattern = detection.patterns[0];

    if (!topPattern) {
      throw new Error("Expected a top pattern");
    }

    const graph = buildWorkGraph(ingestion.items, topPattern.id);

    expect(graph.nodes.map((node) => node.label)).toEqual([
      "Requester",
      "Manager approval",
      "Policy check",
      "System action",
      "Audit log",
      "Exception review",
      "Outcome"
    ]);
    expect(graph.edges).toHaveLength(7);
    expect(graph.metrics.approvalDelayHours).toBeGreaterThan(24);
    expect(graph.metrics.exceptionRate).toBeGreaterThan(0);
  });

  it("separates provisioned and exception review paths", () => {
    const fixtures = loadDemoFixtures();
    const ingestion = ingestWorkTraces(fixtures.rawTraces, fixtures.approvalHistory);
    const detection = detectWorkPatterns(ingestion.items);
    const topPattern = detection.patterns[0];

    if (!topPattern) {
      throw new Error("Expected a top pattern");
    }

    const graph = buildWorkGraph(ingestion.items, topPattern.id);

    const provisioning = graph.edges.find((edge) => edge.id === "edge-policy-provisioning");
    const exception = graph.edges.find((edge) => edge.id === "edge-policy-exception");

    expect(provisioning?.count).toBeGreaterThan(exception?.count ?? 0);
    expect(exception?.exceptionRate).toBeGreaterThan(0);
  });

  it("uses the procurement pattern id for the procurement scenario graph", () => {
    const scenario = loadDemoScenario("procurement-intake");
    const ingestion = ingestWorkTraces(scenario.fixtures.rawTraces, scenario.fixtures.approvalHistory);
    const pattern = detectWorkPatterns(ingestion.items).patterns.find((item) => item.id === "pattern-software_procurement");

    if (!pattern) {
      throw new Error("Expected procurement pattern");
    }

    const graph = buildWorkGraph(ingestion.items, pattern.id);

    expect(graph.id).toBe("graph-pattern-software_procurement");
    expect(graph.patternId).toBe("pattern-software_procurement");
  });
});
