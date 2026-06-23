import { describe, expect, it } from "vitest";
import {
  DEMO_STORAGE_KEY,
  createSeedDemoState,
  exportRunSummary,
  importRunSummary,
  loadPersistedDemoState,
  resetPersistedDemoState,
  saveDemoState,
  type DemoStorage
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

describe("demo persistence", () => {
  it("seeds and persists selected scenario state", () => {
    const storage = makeStorage();
    const state = createSeedDemoState("procurement-intake");

    saveDemoState(state, storage);

    expect(storage.values.has(DEMO_STORAGE_KEY)).toBe(true);
    expect(loadPersistedDemoState(storage)?.selectedScenarioId).toBe("procurement-intake");
  });

  it("resets local demo state to a known baseline", () => {
    const storage = makeStorage();
    const dirty = {
      ...createSeedDemoState("it-access"),
      sampleLoaded: true,
      analysisRequested: true,
      governanceDecision: "approved" as const
    };

    saveDemoState(dirty, storage);
    const reset = resetPersistedDemoState("it-access", storage);

    expect(reset.sampleLoaded).toBe(false);
    expect(reset.analysisRequested).toBe(false);
    expect(reset.governanceDecision).toBe("pending");
    expect(loadPersistedDemoState(storage)).toEqual(reset);
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
});
