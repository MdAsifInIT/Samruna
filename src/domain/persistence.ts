import type {
  AuditEvent,
  AutomationProposal,
  ExecutionRun,
  GovernanceDecision,
  GovernanceRecord,
  LearningRecommendation,
  ScenarioId,
  SimulationResult,
  WorkGraph
} from "./types";

export const DEMO_STORAGE_KEY = "work-graph-foundry.demo-state.v1";
export const DEMO_STATE_VERSION = 1;

export interface DemoStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface PersistedDemoState {
  version: typeof DEMO_STATE_VERSION;
  selectedScenarioId: ScenarioId;
  sampleLoaded: boolean;
  analysisRequested: boolean;
  proposalRequested: boolean;
  selectedProposalId?: string;
  governanceDecision: GovernanceDecision;
  runRequested: boolean;
  graph?: WorkGraph;
  proposals: AutomationProposal[];
  governanceRecords: GovernanceRecord[];
  simulation?: SimulationResult;
  executionRuns: ExecutionRun[];
  recommendations: LearningRecommendation[];
  auditEvents: AuditEvent[];
  updatedAt: string;
}

export interface RunSummaryExport {
  exportedAt: string;
  scenarioId: ScenarioId;
  state: PersistedDemoState;
}

export function createSeedDemoState(
  selectedScenarioId: ScenarioId = "it-access",
  timestamp = "2026-05-16T09:00:00Z"
): PersistedDemoState {
  return {
    version: DEMO_STATE_VERSION,
    selectedScenarioId,
    sampleLoaded: false,
    analysisRequested: false,
    proposalRequested: false,
    governanceDecision: "pending",
    runRequested: false,
    proposals: [],
    governanceRecords: [],
    executionRuns: [],
    recommendations: [],
    auditEvents: [],
    updatedAt: timestamp
  };
}

export function loadPersistedDemoState(storage = resolveDemoStorage()): PersistedDemoState | undefined {
  if (!storage) {
    return undefined;
  }

  try {
    const raw = storage.getItem(DEMO_STORAGE_KEY);

    if (!raw) {
      return undefined;
    }

    const parsed = JSON.parse(raw) as unknown;

    return normalizePersistedDemoState(parsed);
  } catch {
    return undefined;
  }
}

export function saveDemoState(state: PersistedDemoState, storage = resolveDemoStorage()): void {
  if (!storage) {
    return;
  }

  storage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
}

export function resetPersistedDemoState(
  selectedScenarioId: ScenarioId = "it-access",
  storage = resolveDemoStorage()
): PersistedDemoState {
  const seed = createSeedDemoState(selectedScenarioId);

  if (storage) {
    storage.removeItem(DEMO_STORAGE_KEY);
    saveDemoState(seed, storage);
  }

  return seed;
}

export function exportRunSummary(state: PersistedDemoState, timestamp = new Date().toISOString()): string {
  const summary: RunSummaryExport = {
    exportedAt: timestamp,
    scenarioId: state.selectedScenarioId,
    state
  };

  return JSON.stringify(summary, null, 2);
}

export function importRunSummary(raw: string): PersistedDemoState {
  const parsed = JSON.parse(raw) as unknown;

  if (isRunSummaryExport(parsed)) {
    return normalizePersistedDemoState(parsed.state) ?? parsed.state;
  }

  const state = normalizePersistedDemoState(parsed);

  if (state) {
    return state;
  }

  throw new Error("Imported execution summary did not match the workflow state contract");
}

function resolveDemoStorage(): DemoStorage | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.localStorage;
}

function isRunSummaryExport(value: unknown): value is RunSummaryExport {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<RunSummaryExport>;

  return (
    typeof candidate.exportedAt === "string" &&
    (candidate.scenarioId === "it-access" || candidate.scenarioId === "procurement-intake") &&
    Boolean(normalizePersistedDemoState(candidate.state))
  );
}

function normalizePersistedDemoState(value: unknown): PersistedDemoState | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const state = value as Partial<PersistedDemoState>;

  const valid =
    state.version === DEMO_STATE_VERSION &&
    (state.selectedScenarioId === "it-access" || state.selectedScenarioId === "procurement-intake") &&
    typeof state.sampleLoaded === "boolean" &&
    typeof state.analysisRequested === "boolean" &&
    typeof state.proposalRequested === "boolean" &&
    isGovernanceDecision(state.governanceDecision) &&
    typeof state.runRequested === "boolean" &&
    Array.isArray(state.proposals) &&
    Array.isArray(state.governanceRecords) &&
    Array.isArray(state.executionRuns) &&
    Array.isArray(state.recommendations) &&
    Array.isArray(state.auditEvents) &&
    typeof state.updatedAt === "string";

  if (!valid) {
    return undefined;
  }

  const proposals = state.proposals ?? [];
  const selectedProposalId =
    typeof state.selectedProposalId === "string" && proposals.some((proposal) => proposal.id === state.selectedProposalId)
      ? state.selectedProposalId
      : proposals.at(-1)?.id;

  return {
    ...state,
    selectedProposalId
  } as PersistedDemoState;
}

function isGovernanceDecision(value: unknown): value is GovernanceDecision {
  return value === "pending" || value === "approved" || value === "rejected" || value === "changes_requested";
}
