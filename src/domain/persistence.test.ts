import { describe, expect, it } from "vitest";
import {
  DEMO_STORAGE_KEY,
  createSeedDemoState,
  exportRunSummary,
  importRunSummary,
  loadPersistedDemoState,
  resetPersistedDemoState,
  saveDemoState,
  type DemoStorage,
  type PersistedDemoState
} from "./persistence";

function makeStorage(): DemoStorage & { values: Map<string, string> } {
  const values = new Map<string, string>();

  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  };
}

describe("POC - Proof Of Concept persistence", () => {
  it("keeps the demo usable when browser storage rejects writes", () => {
    const storage: DemoStorage = {
      getItem: () => null,
      setItem: () => { throw new DOMException("Quota exceeded", "QuotaExceededError"); },
      removeItem: () => undefined
    };
    expect(saveDemoState(createSeedDemoState(), storage)).toBe(false);
  });

  it("seeds and persists selected scenario state", () => {
    const storage = makeStorage();
    const state = createSeedDemoState("procurement-intake");

    saveDemoState(state, storage);

    expect(storage.values.has(DEMO_STORAGE_KEY)).toBe(true);
    expect(loadPersistedDemoState(storage)?.selectedScenarioId).toBe("procurement-intake");
  });

  it("resets local POC - Proof Of Concept state to a known baseline", () => {
    const storage = makeStorage();
    const dirty: PersistedDemoState = {
      ...createSeedDemoState("it-access"),
      sampleLoaded: true,
      analysisRequested: true,
      proposalRequested: true,
      governanceDecision: "approved" as const,
      runRequested: true,
      graph: { id: "graph-it-access", patternId: "pattern-it-access", nodes: [], edges: [], metrics: { averageCycleTimeHours: 1, exceptionRate: 0, approvalDelayHours: 1 } },
      proposals: [{ id: "proposal-test", patternId: "pattern-it-access", trigger: "trigger", requiredData: [], eligibilityRules: [], policyChecks: [], actions: [], escalations: [], confidence: 1, riskLevel: "low", expectedValue: "value", auditRationale: "rationale", version: 1 }],
      governanceRecords: [
        {
          id: "governance-test",
          proposalId: "proposal-test",
          reviewerRole: "process_owner",
          decision: "approved",
          comments: "ok",
          timestamp: "2026-05-16T10:00:00Z",
          proposalVersion: 1
        }
      ],
      executionRuns: [
        {
          id: "run-test",
          proposalId: "proposal-test",
          requestTraceId: "trace-test",
          status: "completed",
          mockToolCalls: [],
          auditTrail: []
        }
      ],
      recommendations: [
        {
          id: "rec-test",
          source: "delay",
          recommendation: "Test",
          expectedImpact: "None",
          riskLevel: "low",
          suggestedProposalChange: "None"
        }
      ],
      auditEvents: [{ id: "audit-test", timestamp: "2026-05-16T09:00:00Z", actor: "test", action: "Loaded", detail: "Dirty" }]
    };

    saveDemoState(dirty, storage);
    const reset = resetPersistedDemoState("it-access", storage);

    expect(reset.sampleLoaded).toBe(false);
    expect(reset.analysisRequested).toBe(false);
    expect(reset.proposalRequested).toBe(false);
    expect(reset.governanceDecision).toBe("pending");
    expect(reset.runRequested).toBe(false);
    expect(reset.graph).toBeUndefined();
    expect(reset.proposals).toEqual([]);
    expect(reset.governanceRecords).toEqual([]);
    expect(reset.executionRuns).toEqual([]);
    expect(reset.recommendations).toEqual([]);
    expect(reset.auditEvents).toEqual([]);
    expect(loadPersistedDemoState(storage)).toEqual(reset);
  });

  it("ignores malformed JSON in storage", () => {
    const storage = makeStorage();

    storage.setItem(DEMO_STORAGE_KEY, "{not-json");

    expect(loadPersistedDemoState(storage)).toBeUndefined();
  });

  it("exports and imports run summaries", () => {
    const state = {
      ...createSeedDemoState("it-access"),
      sampleLoaded: true,
      auditEvents: [
        {
          id: "audit-test",
          timestamp: "2026-05-16T09:00:00Z",
          actor: "test",
          action: "Scenario loaded",
          detail: "Synthetic state exported."
        }
      ]
    };
    const exported = exportRunSummary(state, "2026-05-16T12:00:00Z");
    const imported = importRunSummary(exported);

    expect(imported.sampleLoaded).toBe(true);
    expect(imported.auditEvents[0].action).toBe("Scenario loaded");
  });

  it("imports older proposal states without a selected proposal id", () => {
    const state = {
      ...createSeedDemoState("it-access"),
      proposalRequested: true,
      proposals: [
        {
          id: "proposal-pattern-standard_access-v1",
          patternId: "pattern-standard_access",
          trigger: "trigger",
          requiredData: [],
          eligibilityRules: [],
          policyChecks: [],
          actions: [],
          escalations: [],
          confidence: 1,
          riskLevel: "low" as const,
          expectedValue: "value",
          auditRationale: "rationale",
          version: 1
        }
      ]
    };
    const imported = importRunSummary(JSON.stringify(state));

    expect(imported.selectedProposalId).toBe("proposal-pattern-standard_access-v1");
    expect(imported.proposals[0].changeSummary).toBeUndefined();
    expect(imported.proposals[0].generatedAt).toBeUndefined();
  });
});
