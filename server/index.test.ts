import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ApiResponse, HealthResponse, WorkspaceSnapshot } from "../src/domain/api";
import { workspaceRoutes } from "../src/domain/api";
import { WorkspaceDatabase } from "./db";
import { createApp } from "./index";
import { WorkspaceService } from "./workspace";

let database: WorkspaceDatabase;
let service: WorkspaceService;
let baseUrl: string;
let server: ReturnType<typeof createApp>;
let nextPort = 49152;

beforeEach(async () => {
  const dbPath = join(mkdtempSync(join(tmpdir(), "wgf-api-")), "test.sqlite");
  database = new WorkspaceDatabase(dbPath);
  service = new WorkspaceService(database);
  server = createApp(service);

  await new Promise<void>((resolve, reject) => {
    const port = nextPort++;
    const handleError = (error: Error) => {
      server.off("error", handleError);
      reject(error);
    };

    server.on("error", handleError);
    server.listen(port, "127.0.0.1", () => {
      server.off("error", handleError);
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

afterEach(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  service.close();
});

describe("backend API", () => {
  it("wraps health responses in the success envelope", async () => {
    const response = await get<HealthResponse>(workspaceRoutes.health);

    expect(response).toMatchObject({
      ok: true,
      data: {
        status: "ok",
        databaseReady: true,
        aiProvider: {
          mode: "mock",
          label: "Deterministic simulation"
        }
      }
    });
    expect(JSON.stringify(response)).not.toContain("OPENAI_API_KEY");
    expect(JSON.stringify(response)).not.toContain("Bearer ");
  });

  it("runs the workflow through HTTP routes", async () => {
    await post<WorkspaceSnapshot>(workspaceRoutes.reset, {});
    await post<WorkspaceSnapshot>(workspaceRoutes.load);
    await post<WorkspaceSnapshot>(workspaceRoutes.analyze);
    const proposed = await post<WorkspaceSnapshot>(workspaceRoutes.proposals, {});
    const approved = await post<WorkspaceSnapshot>(workspaceRoutes.governance, { decision: "approved" });
    const run = await post<WorkspaceSnapshot>(workspaceRoutes.run);

    expect(proposed.ok && proposed.data.proposal?.id).toBe("proposal-pattern-standard_access-v1");
    expect(proposed.ok && proposed.data.aiProvider.lastInvocation?.status).toBe("succeeded");
    expect(approved.ok && approved.data.executionReady).toBe(true);
    expect(run.ok && run.data.executionRun?.status).toBe("completed");
    expect(JSON.stringify(run)).not.toContain("OPENAI_API_KEY");
    expect(JSON.stringify(run)).not.toContain("Bearer ");
  });

  it("wraps malformed import failures in the error envelope", async () => {
    const response = await post<WorkspaceSnapshot>(workspaceRoutes.import, { summary: "{not-json" });

    expect(response).toMatchObject({
      ok: false,
      error: {
        code: "invalid_import"
      }
    });
  });

  it("rejects invalid runtime request shapes before service execution", async () => {
    await expectError(workspaceRoutes.selectScenario, { scenarioId: "missing" }, "invalid_scenario");
    await expectError(workspaceRoutes.governance, { decision: "pending" }, "invalid_governance_decision");
    await expectError(workspaceRoutes.selectProposal, {}, "invalid_proposal_id");
    await expectError(workspaceRoutes.import, { summary: 42 }, "invalid_import");
  });

  it("rejects imports with malformed nested artifacts", async () => {
    await expectError(
      workspaceRoutes.import,
      {
        summary: {
          version: 1,
          selectedScenarioId: "it-access",
          sampleLoaded: true,
          analysisRequested: true,
          proposalRequested: true,
          governanceDecision: "pending",
          runRequested: false,
          proposals: [{ id: "malformed-proposal" }],
          governanceRecords: [],
          executionRuns: [],
          recommendations: [],
          auditEvents: [],
          updatedAt: "2026-05-16T09:00:00Z"
        }
      },
      "invalid_import"
    );
  });

  it("wraps malformed JSON in the error envelope", async () => {
    const response = await postRaw<WorkspaceSnapshot>(workspaceRoutes.import, "{not-json");

    expect(response.status).toBe(400);
    expect(response.payload).toMatchObject({
      ok: false,
      error: {
        code: "invalid_json"
      }
    });
  });
});

async function get<T>(path: string): Promise<ApiResponse<T>> {
  const response = await fetch(`${baseUrl}${path}`);

  return (await response.json()) as ApiResponse<T>;
}

async function post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  return (await response.json()) as ApiResponse<T>;
}

async function postRaw<T>(path: string, body: string): Promise<{ status: number; payload: ApiResponse<T> }> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body
  });

  return {
    status: response.status,
    payload: (await response.json()) as ApiResponse<T>
  };
}

async function expectError(path: string, body: unknown, code: string): Promise<void> {
  const response = await postRaw<WorkspaceSnapshot>(path, JSON.stringify(body));

  expect(response.status).toBe(400);
  expect(response.payload).toMatchObject({
    ok: false,
    error: {
      code
    }
  });
}
