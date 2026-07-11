import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ApiResponse, HealthResponse, WorkspaceSnapshot } from "../src/domain/api";
import { workspaceRoutes } from "../src/domain/api";
import { WorkspaceDatabase } from "./db";
import { createApp, readRateLimits } from "./index";
import { WorkspaceService } from "./workspace";

let database: WorkspaceDatabase;
let service: WorkspaceService;
let baseUrl: string;
let server: ReturnType<typeof createApp>;
let nextPort = 49152;
const DEMO_SESSION = "11111111-1111-4111-8111-111111111111";

beforeEach(async () => {
  const dbPath = join(mkdtempSync(join(tmpdir(), "samruna-api-")), "test.sqlite");
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
  it("reads safe positive rate-limit overrides and falls back for invalid values", () => {
    expect(
      readRateLimits({
        SAMRUNA_RATE_LIMIT_GENERAL_PER_MINUTE: "240",
        SAMRUNA_RATE_LIMIT_MUTATIONS_PER_MINUTE: "0",
        SAMRUNA_RATE_LIMIT_EXPENSIVE_SESSION_PER_10_MINUTES: "2.5",
        SAMRUNA_RATE_LIMIT_EXPENSIVE_IP_PER_10_MINUTES: "9007199254740992"
      } as NodeJS.ProcessEnv)
    ).toEqual({
      generalPerMinute: 240,
      mutationsPerMinute: 60,
      expensivePerTenMinutesPerSession: 10,
      expensivePerTenMinutesPerIp: 30
    });
  });

  it("wraps health responses in the success envelope", async () => {
    const response = await get<HealthResponse>(workspaceRoutes.health);

    expect(response).toMatchObject({
      ok: true,
      data: {
        status: "ok",
        databaseReady: true,
        aiProvider: {
          mode: "mock",
          label: "Historical validation engine"
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

  it("requires a valid demo session for workspace routes", async () => {
    const missing = await fetch(`${baseUrl}${workspaceRoutes.workspace}`);
    const invalid = await fetch(`${baseUrl}${workspaceRoutes.workspace}`, {
      headers: { "X-Samruna-Session": "not-a-uuid" }
    });

    expect(missing.status).toBe(400);
    expect(invalid.status).toBe(400);
    await expect(missing.json()).resolves.toMatchObject({ ok: false, error: { code: "invalid_demo_session" } });
    await expect(invalid.json()).resolves.toMatchObject({ ok: false, error: { code: "invalid_demo_session" } });
  });

  it("isolates workspace state by demo session", async () => {
    const first = "22222222-2222-4222-8222-222222222222";
    const second = "33333333-3333-4333-8333-333333333333";

    await post<WorkspaceSnapshot>(workspaceRoutes.load, undefined, first);
    const firstSnapshot = await get<WorkspaceSnapshot>(workspaceRoutes.workspace, first);
    const secondSnapshot = await get<WorkspaceSnapshot>(workspaceRoutes.workspace, second);

    expect(firstSnapshot.ok && firstSnapshot.data.state.sampleLoaded).toBe(true);
    expect(secondSnapshot.ok && secondSnapshot.data.state.sampleLoaded).toBe(false);
  });

  it("rate limits mutations per demo session with standard headers", async () => {
    let response: Response | undefined;
    for (let request = 0; request < 61; request += 1) {
      response = await fetch(`${baseUrl}${workspaceRoutes.reset}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Samruna-Session": DEMO_SESSION },
        body: "{}"
      });
    }

    expect(response?.status).toBe(429);
    expect(response?.headers.get("ratelimit-limit")).toBe("60");
    expect(response?.headers.get("ratelimit-remaining")).toBe("0");
    expect(Number(response?.headers.get("ratelimit-reset"))).toBeGreaterThan(0);
    expect(Number(response?.headers.get("retry-after"))).toBeGreaterThan(0);
    await expect(response?.json()).resolves.toMatchObject({ ok: false, error: { code: "rate_limited" } });
  });

  it("applies expensive-operation limits by session and trusted client IP", async () => {
    await restartServer({
      trustedProxy: true,
      limits: { expensivePerTenMinutesPerSession: 1, expensivePerTenMinutesPerIp: 1 }
    });
    const first = "55555555-5555-4555-8555-555555555555";
    const second = "66666666-6666-4666-8666-666666666666";
    const forwardedHeaders = { "X-Forwarded-For": "203.0.113.7, 10.0.0.1" };

    for (const sessionId of [first, second]) {
      await postWithHeaders(workspaceRoutes.load, sessionId, forwardedHeaders);
      await postWithHeaders(workspaceRoutes.analyze, sessionId, forwardedHeaders);
    }

    const accepted = await postWithHeaders(workspaceRoutes.proposals, first, forwardedHeaders, {});
    const sameSession = await postWithHeaders(workspaceRoutes.proposals, first, forwardedHeaders, {});
    const sameIp = await postWithHeaders(workspaceRoutes.proposals, second, forwardedHeaders, {});

    expect(accepted.status).toBe(200);
    expect(sameSession.status).toBe(429);
    expect(sameSession.headers.get("ratelimit-limit")).toBe("1");
    expect(sameIp.status).toBe(429);
  });

  it("ignores invalid or oversized forwarded addresses from a trusted proxy", async () => {
    await restartServer({
      trustedProxy: true,
      limits: { expensivePerTenMinutesPerSession: 10, expensivePerTenMinutesPerIp: 1 }
    });
    const first = "88888888-8888-4888-8888-888888888888";
    const second = "99999999-9999-4999-8999-999999999999";
    const oversized = { "X-Forwarded-For": "1".repeat(300) };
    const invalid = { "X-Forwarded-For": "not-an-ip" };

    await postWithHeaders(workspaceRoutes.load, first, oversized);
    await postWithHeaders(workspaceRoutes.analyze, first, oversized);
    await postWithHeaders(workspaceRoutes.load, second, invalid);
    await postWithHeaders(workspaceRoutes.analyze, second, invalid);

    const accepted = await postWithHeaders(workspaceRoutes.proposals, first, oversized, {});
    const fallbackIpLimited = await postWithHeaders(workspaceRoutes.proposals, second, invalid, {});

    expect(accepted.status).toBe(200);
    expect(fallbackIpLimited.status).toBe(429);
    expect(fallbackIpLimited.headers.get("ratelimit-limit")).toBe("1");
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

  it("allows configured GitHub Pages origins through CORS", async () => {
    const response = await fetch(`${baseUrl}${workspaceRoutes.health}`, {
      headers: { Origin: "https://mdasifinit.github.io" }
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBe("https://mdasifinit.github.io");
    expect(response.headers.get("vary")).toBe("Origin");
  });

  it("rejects unknown browser origins before route execution", async () => {
    const response = await fetch(`${baseUrl}${workspaceRoutes.health}`, {
      headers: { Origin: "https://example.invalid" }
    });
    const payload = (await response.json()) as ApiResponse<HealthResponse>;

    expect(response.status).toBe(403);
    expect(payload).toMatchObject({
      ok: false,
      error: {
        code: "cors_forbidden"
      }
    });
  });
});

async function get<T>(path: string, sessionId = DEMO_SESSION): Promise<ApiResponse<T>> {
  const response = await fetch(`${baseUrl}${path}`, { headers: { "X-Samruna-Session": sessionId } });

  return (await response.json()) as ApiResponse<T>;
}

async function post<T>(path: string, body?: unknown, sessionId = DEMO_SESSION): Promise<ApiResponse<T>> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: body === undefined
      ? { "X-Samruna-Session": sessionId }
      : { "Content-Type": "application/json", "X-Samruna-Session": sessionId },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  return (await response.json()) as ApiResponse<T>;
}

async function postRaw<T>(path: string, body: string): Promise<{ status: number; payload: ApiResponse<T> }> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Samruna-Session": DEMO_SESSION },
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

async function restartServer(options: Parameters<typeof createApp>[1]): Promise<void> {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  service.close();

  const dbPath = join(mkdtempSync(join(tmpdir(), "samruna-api-options-")), "test.sqlite");
  database = new WorkspaceDatabase(dbPath);
  service = new WorkspaceService(database);
  server = createApp(service, options);

  await new Promise<void>((resolve, reject) => {
    const port = nextPort++;
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      server.off("error", reject);
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
}

function postWithHeaders(
  path: string,
  sessionId: string,
  extraHeaders: Record<string, string>,
  body?: unknown
): Promise<Response> {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Samruna-Session": sessionId,
      ...extraHeaders
    },
    body: JSON.stringify(body ?? {})
  });
}
