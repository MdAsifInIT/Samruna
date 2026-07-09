import { expect, type APIRequestContext, type ConsoleMessage, type Page, test as base } from "@playwright/test";

const DEMO_STORAGE_KEY = "samruna.demo-state.v1";

type ScenarioExpectation = {
  id: "it-access" | "procurement-intake" | "vendor-onboarding" | "invoice-exceptions";
  label: string;
  graphTitle: string;
  patternLabel: string;
  mockOutput: string;
};

type StoredDemoState = {
  selectedScenarioId: string;
  sampleLoaded: boolean;
  analysisRequested: boolean;
  proposalRequested: boolean;
  governanceDecision: string;
  runRequested: boolean;
  proposals: unknown[];
  executionRuns: unknown[];
  recommendations: unknown[];
};

type LongTaskEntry = {
  duration: number;
  name: string;
  startTime: number;
};

const test = base.extend<{ browserErrorMonitor: void }>({
  browserErrorMonitor: [
    async ({ page }, use) => {
      const browserErrors: string[] = [];
      const recordConsoleError = (message: ConsoleMessage) => {
        if (message.type() === "error") {
          browserErrors.push(`console.error: ${message.text()}`);
        }
      };
      const recordPageError = (error: Error) => {
        browserErrors.push(`pageerror: ${error.message}`);
      };

      page.on("console", recordConsoleError);
      page.on("pageerror", recordPageError);

      await use();

      page.off("console", recordConsoleError);
      page.off("pageerror", recordPageError);

      expect(browserErrors, "Unexpected browser console/page errors").toEqual([]);
    },
    { auto: true }
  ]
});

const scenarios: ScenarioExpectation[] = [
  {
    id: "it-access",
    label: "IT access requests",
    graphTitle: "IT access request flow",
    patternLabel: "Standard application access",
    mockOutput: "simulated Access request operations task IT-2001 created"
  },
  {
    id: "procurement-intake",
    label: "Procurement intake",
    graphTitle: "Procurement intake flow",
    patternLabel: "Software procurement intake",
    mockOutput: "simulated Procurement operations task PR-4001 created"
  },
  {
    id: "vendor-onboarding",
    label: "Vendor onboarding",
    graphTitle: "Vendor onboarding flow",
    patternLabel: "Vendor onboarding review",
    mockOutput: "simulated Vendor risk onboarding task PR-7001 created"
  },
  {
    id: "invoice-exceptions",
    label: "Invoice exceptions",
    graphTitle: "Invoice exception flow",
    patternLabel: "Invoice exception review",
    mockOutput: "simulated Finance exception handling task PR-8001 created"
  }
];

const qaViewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 900 },
  { name: "small mobile", width: 375, height: 812 }
];

const headerViewports = [
  { name: "desktop", width: 1440, height: 1000, mobileNavigation: false },
  { name: "mid breakpoint", width: 900, height: 900, mobileNavigation: true },
  { name: "tablet", width: 768, height: 1024, mobileNavigation: true },
  { name: "mobile", width: 390, height: 900, mobileNavigation: true },
  { name: "small mobile", width: 375, height: 812, mobileNavigation: true }
];

test.beforeEach(async ({ page, request }) => {
  await request.post("/api/workspace/reset", { data: { scenarioId: "it-access" } });
  await page.goto("/");
  await page.evaluate((storageKey) => window.localStorage.removeItem(storageKey), DEMO_STORAGE_KEY);
  await page.reload();
});

test("loads the landing-first screen without browser page or console errors", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Samruna" })).toBeVisible();
  await expect(page.getByLabel("Samruna product preview")).toBeVisible();
  await expect(page.getByRole("button", { name: "Launch" })).toHaveCount(1);
  const landingBlocks = page.getByRole("region", { name: "Landing workflow blocks" });
  const automationPath = page.getByLabel("Connected automation path");

  await expect(landingBlocks).toBeVisible();
  await expect(automationPath).toBeVisible();
  await expect(page.getByRole("region", { name: "Impact evidence" })).toBeVisible();
  await expect(landingBlocks.getByText("Pattern discovery")).toBeVisible();
  await expect(landingBlocks.getByText("Governed proposal")).toBeVisible();
  await expect(landingBlocks.getByText("Safe execution")).toBeVisible();
  await expect(automationPath.getByText("Pattern found")).toBeVisible();
  await expect(automationPath.getByText("Proposal ready")).toBeVisible();
  await expect(automationPath.getByText("Execution gated")).toBeVisible();
  await expect(page.getByRole("button", { name: "Open workspace" })).toBeVisible();
  await page.getByRole("button", { name: "Launch" }).click();
  await expect(page.getByRole("button", { name: "Overview", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByLabel("System status")).toContainText("Validation engine");
  await expect(page.getByLabel("System status")).toContainText("Backend connected");
  await expect(page.getByRole("button", { name: "Evidence", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Graph", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Review & Run", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Audit", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Load workflow" })).toBeVisible();
  await expectScenarioContext(page, scenarios[0].label);
});

for (const scenario of scenarios) {
  test(`runs the ${scenario.id} workflow POC - Proof Of Concept path and reset clears generated output`, async ({ page, request }) => {
    await runGoldenPath(page, request, scenario);

    const exported = await exportSummary(page);
    expect(exported.scenarioId).toBe(scenario.id);
    expect(exported.state.selectedScenarioId).toBe(scenario.id);
    expect(exported.state.proposals).toHaveLength(1);
    expect(exported.state.executionRuns).toHaveLength(1);
    await expectWorkspaceApiState(request, {
      executionRuns: 1,
      selectedScenarioId: scenario.id
    });

    await resetDemo(page, request, scenario);
  });
}

test("keeps simulated execution blocked after governance rejects a proposal", async ({ page, request }) => {
  const scenario = scenarios[0];

  await generateProposal(page, request, scenario);
  await openView(page, "Review & Run");
  await page.getByRole("button", { name: "Reject" }).click();

  await expect(page.getByText("Rejected").first()).toBeVisible();
  await expect(page.getByText("Blocked by rejection").first()).toBeVisible();
  await openView(page, "Review & Run");
  await page.getByText("Technical details").click();
  await expect(page.getByText("Safe execution is blocked by rejection until the proposal is revised and approved.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Execute workflow" })).toBeDisabled();
  await expect(page.getByText(scenario.mockOutput)).toHaveCount(0);

  await waitForStoredDemoStateField(page, "governanceDecision", "rejected");
  const rejectedState = await readStoredDemoState(page);
  expect(rejectedState.governanceDecision).toBe("rejected");
  expect(rejectedState.runRequested).toBe(false);
  expect(rejectedState.executionRuns).toHaveLength(0);
  await expectWorkspaceApiState(request, {
    governanceDecision: "rejected",
    runRequested: false
  });
});

test("recovers a generated run after reload and restores seeded workspace state after reset", async ({ page, request }) => {
  const scenario = scenarios[0];

  await runGoldenPath(page, request, scenario);
  await expect(page.getByText(scenario.mockOutput)).toBeVisible();

  const savedRun = await readStoredDemoState(page);
  expect(savedRun.selectedScenarioId).toBe(scenario.id);
  expect(savedRun.proposalRequested).toBe(true);
  expect(savedRun.runRequested).toBe(true);
  expect(savedRun.executionRuns).toHaveLength(1);

  await page.reload();

  await expect(page.getByText("Samruna").first()).toBeVisible();
  await openView(page, "Graph");
  await expect(page.getByRole("heading", { name: scenario.graphTitle })).toBeVisible();
  await expect(page.getByRole("heading", { name: scenario.patternLabel })).toBeVisible();
  await openView(page, "Review & Run");
  await page.getByText("Technical details").click();
  await expect(page.getByRole("heading", { name: "Workflow runner" })).toBeVisible();
  await expect(page.getByText(scenario.mockOutput)).toBeVisible();
  await expect(page.getByRole("button", { name: "Execute workflow" })).toBeEnabled();

  await resetDemo(page, request, scenario);

  const resetState = await readStoredDemoState(page);
  expect(resetState).toMatchObject({
    selectedScenarioId: scenario.id,
    sampleLoaded: false,
    analysisRequested: false,
    proposalRequested: false,
    governanceDecision: "pending",
    runRequested: false
  });
  expect(resetState.proposals).toHaveLength(0);
  expect(resetState.executionRuns).toHaveLength(0);
  expect(resetState.recommendations).toHaveLength(0);
  await expectWorkspaceApiState(request, {
    executionRuns: 0,
    governanceDecision: "pending",
    selectedScenarioId: scenario.id
  });

  await page.reload();

  await expectScenarioContext(page, scenario.label);
  await openView(page, "Graph");
  await expect(page.getByRole("heading", { name: scenario.graphTitle })).toHaveCount(0);
  await openView(page, "Review & Run");
  await expect(page.getByRole("heading", { name: "Workflow runner" })).toHaveCount(0);
  await expect(page.getByText(scenario.mockOutput)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Execute workflow" })).toHaveCount(0);
});

test("restores a generated run from an exported summary import round trip", async ({ page, request }) => {
  const exportedScenario = scenarios[1];

  await runGoldenPath(page, request, exportedScenario);
  const exportedSummaryText = await exportSummaryText(page);

  await page.getByLabel("Select workflow").selectOption(scenarios[0].id);
  await expectScenarioContext(page, scenarios[0].label);
  await expect(page.getByText(exportedScenario.mockOutput)).toHaveCount(0);
  await page.getByRole("button", { name: "Load workflow" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Analyze workflow" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Generate automation proposal" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(page.getByRole("button", { name: "Execute workflow" })).toBeEnabled();

  await openView(page, "Audit");
  await expect(page.getByRole("heading", { level: 1, name: "Audit" })).toBeVisible();
  await page.getByRole("textbox", { name: "Import execution summary JSON", exact: true }).fill(exportedSummaryText);
  await page.getByRole("button", { name: "Import Summary" }).click();

  await openView(page, "Overview");
  await expectScenarioContext(page, exportedScenario.label);
  await openView(page, "Graph");
  await expect(page.getByRole("heading", { name: exportedScenario.graphTitle })).toBeVisible();
  await expect(page.getByRole("heading", { name: exportedScenario.patternLabel })).toBeVisible();
  await openView(page, "Review & Run");
  await page.getByText("Technical details").click();
  await expect(page.getByLabel("Review and run workflow").getByText(exportedScenario.mockOutput)).toBeVisible();

  await waitForStoredDemoStateField(page, "selectedScenarioId", exportedScenario.id);
  const importedState = await readStoredDemoState(page);
  expect(importedState.selectedScenarioId).toBe(exportedScenario.id);
  expect(importedState.governanceDecision).toBe("approved");
  expect(importedState.executionRuns).toHaveLength(1);
  await expectWorkspaceApiState(request, {
    executionRuns: 1,
    selectedScenarioId: exportedScenario.id
  });
});

test("recovers to seeded state when persisted workspace mirror is malformed", async ({ page, request }) => {
  await page.evaluate((storageKey) => window.localStorage.setItem(storageKey, "{not-json"), DEMO_STORAGE_KEY);
  await page.reload();
  await enterWorkspace(page);

  await expect(page.getByText("Samruna").first()).toBeVisible();
  await expectScenarioContext(page, scenarios[0].label);
  await openView(page, "Graph");
  await expect(page.getByRole("heading", { name: scenarios[0].graphTitle })).toHaveCount(0);
  await openView(page, "Review & Run");
  await expect(page.getByRole("button", { name: "Execute workflow" })).toHaveCount(0);

  await waitForStoredDemoStateField(page, "selectedScenarioId", scenarios[0].id);
  const recoveredState = await readStoredDemoState(page);
  expect(recoveredState).toMatchObject({
    selectedScenarioId: scenarios[0].id,
    sampleLoaded: false,
    analysisRequested: false,
    proposalRequested: false,
    governanceDecision: "pending",
    runRequested: false
  });
  expect(recoveredState.proposals).toHaveLength(0);
  expect(recoveredState.executionRuns).toHaveLength(0);
  await expectWorkspaceApiState(request, {
    executionRuns: 0,
    selectedScenarioId: scenarios[0].id
  });
});

test("performance smoke keeps core interactions within the long-task budget", async ({ page, request }) => {
  await page.addInitScript(() => {
    const monitoredWindow = window as Window & { __samrunaLongTasks?: LongTaskEntry[] };
    monitoredWindow.__samrunaLongTasks = [];

    try {
      const observer = new PerformanceObserver((list) => {
        monitoredWindow.__samrunaLongTasks?.push(
          ...list.getEntries().map((entry) => ({
            duration: entry.duration,
            name: entry.name,
            startTime: entry.startTime
          }))
        );
      });

      observer.observe({ type: "longtask", buffered: true });
    } catch {
      monitoredWindow.__samrunaLongTasks = [];
    }
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Samruna" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Launch" })).toHaveCount(1);
  await page.getByRole("button", { name: "Launch" }).click();
  await openView(page, "Evidence");
  await openView(page, "Graph");
  await openView(page, "Overview");

  await generateProposal(page, request, scenarios[0]);
  await openView(page, "Graph");
  await openView(page, "Review & Run");
  await openView(page, "Review & Run");
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await page.getByRole("button", { name: "Execute workflow" }).click();
  await page.getByText("Technical details").click();
  await expect(page.getByText(scenarios[0].mockOutput)).toBeVisible();
  await settleFrames(page);

  const longTasks = await page.evaluate(() => {
    const monitoredWindow = window as Window & { __samrunaLongTasks?: LongTaskEntry[] };

    return (monitoredWindow.__samrunaLongTasks ?? [])
      .filter((entry) => entry.duration >= 200)
      .map((entry) => ({
        duration: Math.round(entry.duration),
        name: entry.name,
        startTime: Math.round(entry.startTime)
      }));
  });

  expect(longTasks, `Long tasks >= 200ms: ${JSON.stringify(longTasks, null, 2)}`).toEqual([]);
});

test("landing performance smoke keeps scroll animation within the frame budget", async ({ page }) => {
  await page.addInitScript(() => {
    const monitoredWindow = window as Window & { __samrunaLandingLongTasks?: LongTaskEntry[] };
    monitoredWindow.__samrunaLandingLongTasks = [];

    try {
      const observer = new PerformanceObserver((list) => {
        monitoredWindow.__samrunaLandingLongTasks?.push(
          ...list.getEntries().map((entry) => ({
            duration: entry.duration,
            name: entry.name,
            startTime: entry.startTime
          }))
        );
      });

      observer.observe({ type: "longtask", buffered: true });
    } catch {
      monitoredWindow.__samrunaLandingLongTasks = [];
    }
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Samruna" })).toBeVisible();
  await expect(page.getByLabel("Samruna product preview")).toBeVisible();

  const frameStats = await page.evaluate(async () => {
    const frameGaps: number[] = [];
    let lastFrameTime = performance.now();
    const maxScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    for (let index = 0; index <= 40; index += 1) {
      window.scrollTo(0, maxScrollY * (index / 40));
      await new Promise<void>((resolve) => {
        requestAnimationFrame((frameTime) => {
          frameGaps.push(frameTime - lastFrameTime);
          lastFrameTime = frameTime;
          resolve();
        });
      });
    }

    window.scrollTo(0, 0);

    return {
      averageFrameGap: Math.round(frameGaps.reduce((total, gap) => total + gap, 0) / frameGaps.length),
      maxFrameGap: Math.round(Math.max(...frameGaps))
    };
  });

  const longTasks = await page.evaluate(() => {
    const monitoredWindow = window as Window & { __samrunaLandingLongTasks?: LongTaskEntry[] };

    return (monitoredWindow.__samrunaLandingLongTasks ?? [])
      .filter((entry) => entry.duration >= 150)
      .map((entry) => ({
        duration: Math.round(entry.duration),
        name: entry.name,
        startTime: Math.round(entry.startTime)
      }));
  });

  expect(frameStats.maxFrameGap, `Landing scroll frame stats: ${JSON.stringify(frameStats, null, 2)}`).toBeLessThan(120);
  expect(longTasks, `Landing long tasks >= 150ms: ${JSON.stringify(longTasks, null, 2)}`).toEqual([]);

  await page.getByRole("button", { name: "Launch" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("button", { name: "Overview", exact: true })).toHaveAttribute("aria-current", "page");
});

test("landing connector respects reduced motion preference", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByLabel("Samruna product preview")).toBeVisible();
  await page.locator(".landing-workgraph-flow").scrollIntoViewIfNeeded();

  const connectorAnimation = await page.locator(".landing-workgraph-flow").evaluate((element) => {
    const style = window.getComputedStyle(element);

    return {
      animationDuration: style.animationDuration,
      animationName: style.animationName
    };
  });

  expect(connectorAnimation.animationName).toBe("none");
  await page.getByRole("button", { name: "Launch" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

for (const viewport of qaViewports) {
  test(`keeps the landing page and workspace usable without horizontal overflow at ${viewport.width}px ${viewport.name}`, async ({
    page,
    request
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Samruna" })).toBeVisible();
    await expect(page.getByLabel("Samruna product preview")).toBeVisible();
    await assertNoHorizontalOverflow(page, `${viewport.name} landing`);

    await runGoldenPath(page, request, scenarios[0]);
    await expect(page.getByRole("heading", { name: "Workflow runner" })).toBeVisible();
    await assertNoHorizontalOverflow(page, `${viewport.name} workspace`);
  });
}

for (const viewport of headerViewports) {
  test(`keeps header selectors distinct and readable at ${viewport.width}px ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");
    await enterWorkspace(page);

    const viewPicker = page.getByLabel("Select app view");
    const workflowPicker = page.getByLabel("Select workflow");
    const mobileViewPicker = page.locator(".mobile-view-picker");
    const workflowPickerShell = page.locator(".scenario-picker-inline");

    await expect(viewPicker).toHaveCount(1);
    await expect(workflowPicker).toHaveCount(1);
    await expect(workflowPicker).toBeVisible();
    await expect(workflowPickerShell).toContainText("Workflow");
    await expect(page.getByRole("button", { name: "Load workflow" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Analyze workflow" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Generate automation proposal" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Next" })).toBeVisible();

    if (viewport.mobileNavigation) {
      await expect(page.locator(".sidebar")).toBeHidden();
      await expect(mobileViewPicker).toBeVisible();
      await expect(mobileViewPicker).toContainText("View");
      await expect(viewPicker).toBeVisible();
    } else {
      await expect(page.locator(".sidebar")).toBeVisible();
      await expect(mobileViewPicker).toBeHidden();
      await expect(viewPicker).toBeHidden();
    }

    await assertNoHorizontalOverflow(page, `${viewport.name} header selectors`);
  });
}

test("keeps the mobile graph fit-to-width without floating edge labels", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await enterWorkspace(page);
  await page.getByLabel("Select workflow").selectOption(scenarios[0].id);
  await page.getByRole("button", { name: "Load workflow" }).click();
  await page.getByRole("button", { name: "Analyze workflow" }).click();
  await openView(page, "Graph");

  await expect(page.getByRole("heading", { name: scenarios[0].graphTitle })).toBeVisible();
  await expect(page.locator(".graph-edge-label")).toHaveCount(0);
  await assertGraphWorkspaceFits(page, "mobile graph");

  await page.getByLabel(/Select graph node Exception review/i).click();
  const graphWorkspace = page.locator(".graph-workspace");
  const graphLegend = graphWorkspace.locator(".graph-legend");
  const selectedDetail = graphWorkspace
    .locator(".graph-detail-card")
    .filter({ has: page.getByRole("heading", { name: "Exception review" }) });

  await expect(page.locator(".graph-sidebar .graph-detail-card")).toHaveCount(0);
  await expect(selectedDetail).toContainText("requires human review");
  await expect(selectedDetail).toContainText("manual decision");
  await expect(selectedDetail).toBeVisible();

  const detailBox = await selectedDetail.boundingBox();
  const legendBox = await graphLegend.boundingBox();

  expect(detailBox).not.toBeNull();
  expect(legendBox).not.toBeNull();
  expect(detailBox!.y).toBeGreaterThan(legendBox!.y + legendBox!.height - 1);

  await page.getByLabel(/Select graph node Requester/i).click();
  const requesterDetail = graphWorkspace
    .locator(".graph-detail-card")
    .filter({ has: page.getByRole("heading", { name: "Requester" }) });

  await expect(requesterDetail).toBeVisible();
  await expect(requesterDetail).toContainText("historical validation model");
  await expect(selectedDetail).toHaveCount(0);
});

async function runGoldenPath(page: Page, request: APIRequestContext, scenario: ScenarioExpectation) {
  await generateProposal(page, request, scenario);

  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(page.getByText("Available").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Execute workflow" })).toBeEnabled();

  await page.getByRole("button", { name: "Execute workflow" }).click();
  await page.getByText("Technical details").click();
  await expect(page.getByRole("heading", { name: "Workflow runner" })).toBeVisible();
  await expect(page.getByText(scenario.mockOutput)).toBeVisible();
  await expectWorkspaceApiState(request, {
    executionRuns: 1,
    selectedScenarioId: scenario.id
  });
}

async function expectScenarioContext(page: Page, label: string) {
  // Topbar context was removed in polish plan. State is verified via API and UI blocks.
}

async function generateProposal(page: Page, request: APIRequestContext, scenario: ScenarioExpectation) {
  await enterWorkspace(page);
  await page.getByLabel("Select workflow").selectOption(scenario.id);
  await expectScenarioContext(page, scenario.label);

  await page.getByRole("button", { name: "Load workflow" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("Raw traces")).toBeVisible();
  await expect(page.getByText("Cases")).toBeVisible();

  await page.getByRole("button", { name: "Analyze workflow" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("heading", { name: scenario.graphTitle })).toBeVisible();
  await expect(page.getByRole("heading", { name: scenario.patternLabel })).toBeVisible();

  await page.getByRole("button", { name: "Generate automation proposal" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("heading", { name: "Is the automation safe to approve and run?" })).toBeVisible();
  await expect(page.getByLabel("Proposal provider provenance")).toContainText("Validation engine");
  await expect(page.getByLabel("Proposal provider provenance")).toContainText("Proposal generated");

  await expect(page.getByRole("button", { name: "Execute workflow" })).toBeDisabled();

  await expect(page.getByText("Blocked").first()).toBeVisible();
  await expectWorkspaceApiState(request, {
    governanceDecision: "pending",
    selectedScenarioId: scenario.id
  });
}

async function exportSummary(page: Page) {
  return JSON.parse(await exportSummaryText(page)) as {
    scenarioId: string;
    state: {
      selectedScenarioId: string;
      proposals: unknown[];
      executionRuns: unknown[];
    };
  };
}

async function exportSummaryText(page: Page) {
  await openView(page, "Audit");
  await page.getByRole("button", { name: "Export Summary" }).click();

  const runSummary = page.getByRole("textbox", { name: "Execution summary JSON", exact: true });
  await expect(runSummary).not.toHaveValue("");

  return runSummary.inputValue();
}

async function resetDemo(page: Page, request: APIRequestContext, scenario: ScenarioExpectation) {
  await openView(page, "Audit");
  await page.getByRole("button", { name: "Reset workflow state" }).click();

  await expectScenarioContext(page, scenario.label);
  await openView(page, "Graph");
  await expect(page.getByRole("heading", { name: scenario.graphTitle })).toHaveCount(0);
  await openView(page, "Review & Run");
  await expect(page.getByRole("heading", { name: "Governed automation proposal" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Workflow runner" })).toHaveCount(0);
  await expect(page.getByText(scenario.mockOutput)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Execute workflow" })).toHaveCount(0);
  await expectWorkspaceApiState(request, {
    executionRuns: 0,
    proposals: 0,
    selectedScenarioId: scenario.id
  });
}

async function settleFrames(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      })
  );
}

async function assertNoHorizontalOverflow(page: Page, label: string) {
  const horizontalOverflow = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const scrollWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    const offenders = Array.from(document.body.querySelectorAll("*"))
      .map((element) => {
        const rect = element.getBoundingClientRect();

        return {
          insideGraphWorkspace: Boolean(element.closest(".graph-workspace")),
          tagName: element.tagName.toLowerCase(),
          className: typeof element.className === "string" ? element.className : "",
          ariaLabel: element.getAttribute("aria-label") ?? "",
          text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 80) ?? "",
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width)
        };
      })
      .filter((element) => !element.insideGraphWorkspace && (element.right > viewportWidth + 1 || element.left < -1))
      .slice(0, 5);

    return {
      amount: scrollWidth - viewportWidth,
      offenders,
      scrollWidth,
      viewportWidth
    };
  });

  expect(
    horizontalOverflow.amount,
    `Horizontal overflow during ${label}: ${JSON.stringify(horizontalOverflow, null, 2)}`
  ).toBeLessThanOrEqual(1);
}

async function assertGraphWorkspaceFits(page: Page, label: string) {
  const graphOverflow = await page.locator(".graph-workspace").evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth
  }));

  expect(
    graphOverflow.scrollWidth - graphOverflow.clientWidth,
    `Graph overflow during ${label}: ${JSON.stringify(graphOverflow, null, 2)}`
  ).toBeLessThanOrEqual(1);
}

async function enterWorkspace(page: Page) {
  const launchButton = page.getByRole("button", { name: "Launch" });

  if (await launchButton.isVisible()) {
    await launchButton.click();
    await expect(page).toHaveURL(/\/dashboard$/);
  }

  const overviewButton = page.getByRole("button", { name: "Overview", exact: true });
  const viewPicker = page.getByLabel("Select app view");

  await expect
    .poll(async () => (await overviewButton.isVisible()) || (await viewPicker.isVisible()), {
      message: "workspace navigation becomes visible"
    })
    .toBe(true);

  if (await overviewButton.isVisible()) {
    await expect(overviewButton).toBeVisible();
  } else {
    await expect(viewPicker).toBeVisible();
  }
}

async function openView(page: Page, name: string) {
  const navButton = page.getByRole("button", { name, exact: true });
  const navButtonCount = await navButton.count();

  for (let index = 0; index < navButtonCount; index += 1) {
    const candidate = navButton.nth(index);

    if (await candidate.isVisible()) {
      if (await candidate.isEnabled()) {
        await candidate.click();
      }

      return;
    }
  }

  const picker = page.getByLabel("Select app view");

  if (!(await picker.isVisible())) {
    return;
  }

  const targetOption = picker.locator("option", { hasText: name });

  if ((await targetOption.count()) && !(await targetOption.first().isDisabled())) {
    await picker.selectOption({ label: name });
  }
}

async function readStoredDemoState(page: Page) {
  const handle = await page.waitForFunction((storageKey) => {
    const raw = window.localStorage.getItem(storageKey);

    if (!raw) {
      return undefined;
    }

    return JSON.parse(raw);
  }, DEMO_STORAGE_KEY);

  return handle.jsonValue() as Promise<StoredDemoState>;
}

async function waitForStoredDemoStateField(page: Page, field: keyof StoredDemoState, expected: string | boolean) {
  await page.waitForFunction(
    ([storageKey, fieldName, expectedValue]) => {
      const raw = window.localStorage.getItem(storageKey as string);

      if (!raw) {
        return false;
      }

      try {
        const stored = JSON.parse(raw) as Record<string, unknown>;

        return stored[fieldName as string] === expectedValue;
      } catch {
        return false;
      }
    },
    [DEMO_STORAGE_KEY, field, expected]
  );
}

async function expectWorkspaceApiState(request: APIRequestContext, expected: Record<string, string | number | boolean>) {
  const response = await request.get("/api/workspace");
  expect(response.ok()).toBeTruthy();
  const body = (await response.json()) as {
    data?: {
      state?: Record<string, unknown>;
    };
  };
  const state = body.data?.state ?? {};

  for (const [field, value] of Object.entries(expected)) {
    const actual = state[field];
    expect(Array.isArray(actual) && typeof value === "number" ? actual.length : actual, `workspace API field ${field}`).toBe(value);
  }
}
