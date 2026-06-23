import { describe, expect, it } from "vitest";
import { loadDemoFixtures } from "./fixtures";
import { buildWorkGraph } from "./graph";
import { ingestWorkTraces } from "./ingestion";

describe("buildWorkGraph", () => {
  it("builds the access request graph from normalized items", () => {
    const fixtures = loadDemoFixtures();
    const ingestion = ingestWorkTraces(fixtures.rawTraces, fixtures.approvalHistory);
    const graph = buildWorkGraph(ingestion.items);

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
    const graph = buildWorkGraph(ingestion.items);

    const provisioning = graph.edges.find((edge) => edge.id === "edge-policy-provisioning");
    const exception = graph.edges.find((edge) => edge.id === "edge-policy-exception");

    expect(provisioning?.count).toBeGreaterThan(exception?.count ?? 0);
    expect(exception?.exceptionRate).toBeGreaterThan(0);
  });
});
