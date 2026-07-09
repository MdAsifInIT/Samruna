import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_DB_PATH, resolveWorkspaceDbPath, WorkspaceDatabase } from "./db";
import { MockAiProvider, type AiProvider, type ExecutionContext, type ProposalContext } from "../src/ai/providers";
import type { AutomationProposal, ExecutionRun } from "../src/domain/types";
import { createServerAiProvider } from "./ai";
import { WorkspaceError, WorkspaceService } from "./workspace";

let database: WorkspaceDatabase;
let service: WorkspaceService;

beforeEach(() => {
  const dbPath = join(mkdtempSync(join(tmpdir(), "samruna-backend-")), "test.sqlite");
  database = new WorkspaceDatabase(dbPath);
  service = new WorkspaceService(database);
});

afterEach(() => {
  service.close();
});

describe("WorkspaceService", () => {
  it("defaults the workspace database to the documented .samruna path", () => {
    const originalDbPath = process.env.SAMRUNA_DB_PATH;
    const originalSqlitePath = process.env.SAMRUNA_SQLITE_PATH;

    delete process.env.SAMRUNA_DB_PATH;
    delete process.env.SAMRUNA_SQLITE_PATH;

    try {
      expect(DEFAULT_DB_PATH.endsWith(join(".samruna", "samruna.sqlite"))).toBe(true);
      expect(resolveWorkspaceDbPath()).toBe(DEFAULT_DB_PATH);

      process.env.SAMRUNA_SQLITE_PATH = join("legacy", "demo.sqlite");
      expect(resolveWorkspaceDbPath()).toBe(join("legacy", "demo.sqlite"));

      process.env.SAMRUNA_DB_PATH = join("preferred", "demo.sqlite");
      expect(resolveWorkspaceDbPath()).toBe(join("preferred", "demo.sqlite"));
    } finally {
      if (originalDbPath === undefined) {
        delete process.env.SAMRUNA_DB_PATH;
      } else {
        process.env.SAMRUNA_DB_PATH = originalDbPath;
      }

      if (originalSqlitePath === undefined) {
        delete process.env.SAMRUNA_SQLITE_PATH;
      } else {
        process.env.SAMRUNA_SQLITE_PATH = originalSqlitePath;
      }
    }
  });

  it("does not open the workspace database when the CLI module is imported", async () => {
    const originalDbPath = process.env.SAMRUNA_DB_PATH;
    const dbPath = join(mkdtempSync(join(tmpdir(), "samruna-cli-import-")), "cli-import.sqlite");

    process.env.SAMRUNA_DB_PATH = dbPath;

    try {
      await import("./cli");
      expect(existsSync(dbPath)).toBe(false);
    } finally {
      if (originalDbPath === undefined) {
        delete process.env.SAMRUNA_DB_PATH;
      } else {
        process.env.SAMRUNA_DB_PATH = originalDbPath;
      }
    }
  });

  it("returns health with a ready database", () => {
    expect(service.health()).toMatchObject({
      status: "ok",
      databaseReady: true,
      organizationId: "synthetic-foundry-org",
      aiProvider: {
        mode: "mock",
        label: "Historical validation engine"
      }
    });
  });

  it("creates server AI providers from server-only environment values", () => {
    const provider = createServerAiProvider({
      OPENAI_API_KEY: "sk-test",
      OPENAI_MODEL: "gpt-env-test"
    } as NodeJS.ProcessEnv);

    expect(provider.status).toMatchObject({
      mode: "openai",
      model: "gpt-env-test"
    });
  });

  it("resets to the deterministic IT access baseline", () => {
    const snapshot = service.reset();

    expect(snapshot.state).toMatchObject({
      selectedScenarioId: "it-access",
      sampleLoaded: false,
      analysisRequested: false,
      proposalRequested: false,
      governanceDecision: "pending",
      runRequested: false
    });
    expect(snapshot.state.proposals).toHaveLength(0);
    expect(snapshot.scenario.label).toBe("IT access requests");
  });

  it("switches to procurement and clears generated state", async () => {
    service.load();
    service.analyze();
    await service.createProposal();

    const snapshot = service.selectScenario({ scenarioId: "procurement-intake" });

    expect(snapshot.state.selectedScenarioId).toBe("procurement-intake");
    expect(snapshot.state.proposals).toHaveLength(0);
    expect(snapshot.state.graph).toBeUndefined();
    expect(snapshot.scenario.label).toBe("Procurement intake");
  });

  it("persists generated artifacts through approve and run", async () => {
    service.load();
    service.analyze();
    const proposalSnapshot = await service.createProposal();

    expect(proposalSnapshot.proposal?.id).toBe("proposal-pattern-standard_access-v1");
    expect(proposalSnapshot.state.simulation?.totalCases).toBeGreaterThan(0);

    const approvedSnapshot = service.decideGovernance({ decision: "approved" });
    expect(approvedSnapshot.executionReady).toBe(true);

    const runSnapshot = await service.run();
    expect(runSnapshot.executionRun?.status).toBe("completed");
    expect(runSnapshot.executionRun?.mockToolCalls.map((call) => call.tool)).toContain("audit-log.write");
    expect(runSnapshot.learningRecommendation?.recommendation).toMatch(/human-review/i);

    const artifactKinds = database.listArtifacts().map((artifact) => artifact.kind);
    expect(artifactKinds).toContain("graph");
    expect(artifactKinds).toContain("proposal");
    expect(artifactKinds).toContain("model_invocation");
    expect(artifactKinds).toContain("simulation");
    expect(artifactKinds).toContain("governance");
    expect(artifactKinds).toContain("execution");
    expect(artifactKinds).toContain("recommendation");
    expect(artifactKinds).toContain("audit");
  });

  it("keeps execution blocked when governance rejects the proposal", async () => {
    service.load();
    service.analyze();
    await service.createProposal();
    service.decideGovernance({ decision: "rejected" });

    const snapshot = await service.run();

    expect(snapshot.executionReady).toBe(false);
    expect(snapshot.state.runRequested).toBe(false);
    expect(snapshot.state.executionRuns).toHaveLength(0);
    expect(snapshot.executionGateLabel).toBe("Blocked by rejection");
  });

  it("round trips exported workspace state through import", async () => {
    service.load();
    service.analyze();
    await service.createProposal();
    service.decideGovernance({ decision: "approved" });
    await service.run();

    const exported = service.export();
    service.reset({ scenarioId: "procurement-intake" });

    const imported = service.import({ summary: exported });

    expect(imported.state.selectedScenarioId).toBe("it-access");
    expect(imported.state.governanceDecision).toBe("approved");
    expect(imported.state.executionRuns).toHaveLength(1);
  });

  it("rejects malformed imports with a safe error", () => {
    expect(() => service.import({ summary: "{not-json" })).toThrowError(WorkspaceError);
  });

  it("creates proposal revisions with deterministic generated timestamps", async () => {
    service.load();
    service.analyze();
    await service.createProposal();
    const revision = await service.createProposal({ changeSummary: "Revision from backend test." });

    expect(revision.proposalVersions).toHaveLength(2);
    expect(revision.proposal?.version).toBe(2);
    expect(revision.proposal?.generatedAt).toBe("2026-05-16T10:00:00.000Z");
  });

  it("returns a typed error when selecting an unknown proposal", () => {
    expect(() => service.selectProposal({ proposalId: "missing" })).toThrowError(WorkspaceError);
  });

  it("uses an injected AI provider and exposes non-secret provider metadata", async () => {
    const provider = new RecordingProvider();
    const injected = new WorkspaceService(database, provider);

    injected.load();
    injected.analyze();
    const snapshot = await injected.createProposal();

    expect(provider.proposalCalls).toBe(1);
    expect(snapshot.aiProvider).toMatchObject({
      mode: "openai",
      label: "Test OpenAI provider",
      model: "gpt-test",
      lastInvocation: {
        providerMode: "openai",
        status: "succeeded",
        validationStatus: "validated"
      }
    });
    expect(injected.health().aiProvider.model).toBe("gpt-test");
  });

  it("uses an injected AI provider for execution and normalizes returned run fields", async () => {
    const provider = new RecordingProvider();
    const injected = new WorkspaceService(database, provider);

    injected.load();
    injected.analyze();
    await injected.createProposal();
    injected.decideGovernance({ decision: "approved" });
    const snapshot = await injected.run();

    expect(provider.executionCalls).toBe(1);
    expect(provider.lastExecutionContext?.scenario.id).toBe("it-access");
    expect(provider.lastExecutionContext?.requestTrace.id).toBe("case-2001-email-1");
    expect(provider.lastExecutionContext?.policyRules.length).toBeGreaterThan(0);
    expect(snapshot.executionRun).toMatchObject({
      id: "run-case-2001",
      proposalId: "proposal-pattern-standard_access-v1",
      requestTraceId: "case-2001-email-1",
      status: "completed"
    });
    expect(snapshot.aiProvider.lastInvocation).toMatchObject({
      providerMode: "openai",
      status: "succeeded",
      validationStatus: "validated"
    });
  });

  it("falls back to deterministic proposals when the live provider fails", async () => {
    const failing = new FailingProvider();
    const injected = new WorkspaceService(database, failing);

    injected.load();
    injected.analyze();
    const snapshot = await injected.createProposal();

    expect(snapshot.proposal?.id).toBe("proposal-pattern-standard_access-v1");
    expect(snapshot.aiProvider.lastInvocation).toMatchObject({
      providerMode: "openai",
      status: "fallback",
      validationStatus: "failed",
      errorCode: "provider_error"
    });
    expect(snapshot.auditEvents.some((event) => event.action === "Fallback proposal generated")).toBe(true);
  });

  it("falls back to deterministic execution when the live provider fails during run", async () => {
    const failing = new FailingProvider();
    const injected = new WorkspaceService(database, failing);

    injected.load();
    injected.analyze();
    await injected.createProposal();
    injected.decideGovernance({ decision: "approved" });
    const snapshot = await injected.run();

    expect(snapshot.executionRun).toMatchObject({
      id: "run-case-2001",
      status: "completed"
    });
    expect(snapshot.aiProvider.lastInvocation).toMatchObject({
      providerMode: "openai",
      status: "fallback",
      validationStatus: "failed",
      errorCode: "provider_error"
    });
  });
});

class RecordingProvider extends MockAiProvider {
  proposalCalls = 0;
  executionCalls = 0;
  lastExecutionContext?: ExecutionContext;
  override status = {
    mode: "openai" as const,
    label: "Test OpenAI provider",
    available: true,
    model: "gpt-test"
  };

  override async generateProposal(context: ProposalContext): Promise<AutomationProposal> {
    this.proposalCalls += 1;
    const proposal = await super.generateProposal(context);

    return {
      ...proposal,
      id: "model-returned-id",
      version: 99
    };
  }

  override async generateExecutionRun(context: ExecutionContext): Promise<ExecutionRun> {
    this.executionCalls += 1;
    this.lastExecutionContext = context;
    const execution = await super.generateExecutionRun(context);

    return {
      ...execution,
      id: "model-returned-run-id",
      proposalId: "model-returned-proposal-id",
      requestTraceId: "model-returned-trace-id",
      status: "running"
    };
  }
}

class FailingProvider implements AiProvider {
  status = {
    mode: "openai" as const,
    label: "Failing OpenAI provider",
    available: true,
    model: "gpt-test"
  };

  async generateProposal(): Promise<AutomationProposal> {
    throw new Error("raw provider failure with no secrets");
  }

  async generateExecutionRun(): Promise<ExecutionRun> {
    throw new Error("raw provider failure with no secrets");
  }
}
