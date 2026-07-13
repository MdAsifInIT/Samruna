import { afterEach, describe, expect, it, vi } from "vitest";
import { createApiClient, DEMO_SESSION_STORAGE_KEY } from "./apiClient";

const SESSION_ID = "123e4567-e89b-42d3-a456-426614174000";

describe("createApiClient", () => {
  afterEach(() => vi.useRealTimers());
  it("persists one tab session and sends it only to workspace routes", async () => {
    const storage = createStorage();
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) =>
      jsonResponse({ ok: true, data: String(input).endsWith("/health") ? { status: "ok" } : { state: {} } })
    );
    const client = createApiClient({ fetcher: fetcher as typeof fetch, storage, uuid: () => SESSION_ID });

    await client.getHealth();
    await client.getWorkspace();

    expect(storage.getItem(DEMO_SESSION_STORAGE_KEY)).toBe(SESSION_ID);
    expect(new Headers(fetcher.mock.calls[0][1]?.headers).has("X-Samruna-Session")).toBe(false);
    expect(new Headers(fetcher.mock.calls[1][1]?.headers).get("X-Samruna-Session")).toBe(SESSION_ID);
  });

  it("reuses an existing valid session instead of generating another", async () => {
    const storage = createStorage([[DEMO_SESSION_STORAGE_KEY, SESSION_ID]]);
    const uuid = vi.fn(() => "00000000-0000-4000-8000-000000000000");
    const client = createApiClient({ fetcher: vi.fn(async () => jsonResponse({ ok: true, data: {} })) as typeof fetch, storage, uuid });

    await client.getWorkspace();
    expect(uuid).not.toHaveBeenCalled();
  });

  it.each([
    ["text/html", "<h1>proxy error</h1>"],
    ["application/json", "not-json"]
  ])("sanitizes invalid %s responses", async (contentType, body) => {
    const client = createApiClient({
      fetcher: vi.fn(async () => new Response(body, { headers: { "content-type": contentType } })) as typeof fetch,
      storage: createStorage(),
      uuid: () => SESSION_ID
    });

    await expect(client.getWorkspace()).rejects.toMatchObject({ code: "invalid_response" });
    await expect(client.getWorkspace()).rejects.not.toHaveProperty("message", expect.stringContaining("proxy error"));
  });

  it("preserves stable server error envelopes", async () => {
    const client = createApiClient({
      fetcher: vi.fn(async () => jsonResponse({ ok: false, error: { code: "rate_limited", message: "Try later" } }, 429)) as typeof fetch,
      storage: createStorage(),
      uuid: () => SESSION_ID
    });

    await expect(client.getWorkspace()).rejects.toEqual(expect.objectContaining({ code: "rate_limited", message: "Try later" }));
  });

  it("aborts requests at the configured timeout", async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    }));
    const client = createApiClient({ fetcher: fetcher as typeof fetch, storage: createStorage(), uuid: () => SESSION_ID, timeoutMs: 25 });
    const assertion = expect(client.getWorkspace()).rejects.toMatchObject({
      code: "request_timeout",
      message: "Request timed out after 25ms."
    });
    await vi.advanceTimersByTimeAsync(25);
    await assertion;
  });

  it.each([
    ["proposal generation", (client: ReturnType<typeof createApiClient>) => client.createProposal()],
    ["workflow simulation", (client: ReturnType<typeof createApiClient>) => client.runApprovedWorkflow()]
  ])("uses the extended timeout for %s", async (_label, startRequest) => {
    vi.useFakeTimers();
    const fetcher = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    }));
    const client = createApiClient({
      fetcher: fetcher as typeof fetch,
      storage: createStorage(),
      uuid: () => SESSION_ID,
      timeoutMs: 25,
      longRunningTimeoutMs: 75
    });
    const request = startRequest(client);
    const assertion = expect(request).rejects.toMatchObject({
      code: "request_timeout",
      message: "Request timed out after 75ms."
    });

    await vi.advanceTimersByTimeAsync(25);
    expect(fetcher.mock.calls[0][1]?.signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(49);
    expect(fetcher.mock.calls[0][1]?.signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await assertion;
  });

  it("keeps the timeout active while reading a stalled JSON body", async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => Promise.resolve({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => new Promise<unknown>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      })
    } as Response));
    const client = createApiClient({ fetcher: fetcher as typeof fetch, storage: createStorage(), uuid: () => SESSION_ID, timeoutMs: 25 });
    const assertion = expect(client.getWorkspace()).rejects.toMatchObject({ code: "request_timeout" });
    await vi.advanceTimersByTimeAsync(25);
    await assertion;
  });

  it("reports a caller abort separately from a timeout", async () => {
    const abortController = new AbortController();
    const fetcher = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    }));
    const client = createApiClient({
      fetcher: fetcher as typeof fetch,
      storage: createStorage(),
      uuid: () => SESSION_ID,
      signal: abortController.signal
    });
    const assertion = expect(client.getWorkspace()).rejects.toMatchObject({ code: "request_aborted" });
    abortController.abort();
    await assertion;
  });
});

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json" } });
}

function createStorage(entries: Array<[string, string]> = []) {
  const values = new Map(entries);
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); }
  };
}
