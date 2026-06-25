import { expect, type ConsoleMessage, type Page, test as base } from "@playwright/test";

const DEMO_STORAGE_KEY = "work-graph-foundry.demo-state.v1";

type ScenarioExpectation = {
  id: "it-access" | "procurement-intake";
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
    mockOutput: "simulated task IT-2001 created"
  },
  {
    id: "procurement-intake",
    label: "Procurement intake",
    graphTitle: "Procurement intake flow",
    patternLabel: "Software procurement intake",
    mockOutput: "simulated task PR-4001 created"
  }
];

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate((storageKey) => window.localStorage.removeItem(storageKey), DEMO_STORAGE_KEY);
  await page.reload();
});

test("loads the baseline screen without browser page or console errors", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Enterprise Work Intelligence Console" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Command Center", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("button", { name: "Observe", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Analyze", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Plan", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Govern", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Execute", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Review", exact: true })).toBeVisible();
  await expect(page.getByLabel("Operational summary").getByText(scenarios[0].label, { exact: true })).toBeVisible();
});

for (const scenario of scenarios) {
  test(`runs the ${scenario.id} workflow demo path and reset clears generated output`, async ({ page }) => {
    await runGoldenPath(page, scenario);

    const exported = await exportSummary(page);
    expect(exported.scenarioId).toBe(scenario.id);
    expect(exported.state.selectedScenarioId).toBe(scenario.id);
    expect(exported.state.proposals).toHaveLength(1);
    expect(exported.state.executionRuns).toHaveLength(1);

    await resetDemo(page, scenario);
  });
}

test("keeps simulated execution blocked after governance rejects a proposal", async ({ page }) => {
  const scenario = scenarios[0];

  await generateProposal(page, scenario);
  await page.getByLabel("Workflow controls").getByRole("button", { name: "Reject" }).click();

  await expect(page.getByText("Rejected").first()).toBeVisible();
  await expect(page.getByText("Blocked by rejection").first()).toBeVisible();
  await openView(page, "Execute");
  await expect(page.getByText("Execution is blocked by rejection until the proposal is revised and approved.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Run simulation" })).toBeDisabled();
  await expect(page.getByText(scenario.mockOutput)).toHaveCount(0);

  await waitForStoredDemoStateField(page, "governanceDecision", "rejected");
  const rejectedState = await readStoredDemoState(page);
  expect(rejectedState.governanceDecision).toBe("rejected");
  expect(rejectedState.runRequested).toBe(false);
  expect(rejectedState.executionRuns).toHaveLength(0);
});

test("recovers a generated run after reload and restores seeded localStorage after reset", async ({ page }) => {
  const scenario = scenarios[0];

  await runGoldenPath(page, scenario);
  await expect(page.getByText(scenario.mockOutput)).toBeVisible();

  const savedRun = await readStoredDemoState(page);
  expect(savedRun.selectedScenarioId).toBe(scenario.id);
  expect(savedRun.proposalRequested).toBe(true);
  expect(savedRun.runRequested).toBe(true);
  expect(savedRun.executionRuns).toHaveLength(1);

  await page.reload();

  await expect(page.getByRole("heading", { name: "Enterprise Work Intelligence Console" })).toBeVisible();
  await openView(page, "Analyze");
  await expect(page.getByRole("heading", { name: scenario.graphTitle })).toBeVisible();
  await expect(page.getByRole("heading", { name: scenario.patternLabel })).toBeVisible();
  await openView(page, "Execute");
  await expect(page.getByRole("heading", { name: "Workflow runner" })).toBeVisible();
  await expect(page.getByText(scenario.mockOutput)).toBeVisible();
  await expect(page.getByRole("button", { name: "Run simulation" })).toBeEnabled();

  await resetDemo(page, scenario);

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

  await page.reload();

  await expect(page.getByLabel("Operational summary").getByText(scenario.label, { exact: true })).toBeVisible();
  await openView(page, "Analyze");
  await expect(page.getByRole("heading", { name: scenario.graphTitle })).toHaveCount(0);
  await openView(page, "Execute");
  await expect(page.getByRole("heading", { name: "Workflow runner" })).toHaveCount(0);
  await expect(page.getByText(scenario.mockOutput)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Run simulation" })).toBeDisabled();
});

test("restores a generated run from an exported summary import round trip", async ({ page }) => {
  const exportedScenario = scenarios[1];

  await runGoldenPath(page, exportedScenario);
  const exportedSummaryText = await exportSummaryText(page);

  await page.getByLabel("Select workflow").selectOption(scenarios[0].id);
  await expect(page.getByLabel("Operational summary").getByText(scenarios[0].label, { exact: true })).toBeVisible();
  await expect(page.getByText(exportedScenario.mockOutput)).toHaveCount(0);

  await openView(page, "Review");
  await page.getByRole("textbox", { name: "Import execution summary JSON", exact: true }).fill(exportedSummaryText);
  await page.getByRole("button", { name: "Import Summary" }).click();

  await openView(page, "Command Center");
  await expect(page.getByLabel("Operational summary").getByText(exportedScenario.label, { exact: true })).toBeVisible();
  await openView(page, "Analyze");
  await expect(page.getByRole("heading", { name: exportedScenario.graphTitle })).toBeVisible();
  await expect(page.getByRole("heading", { name: exportedScenario.patternLabel })).toBeVisible();
  await openView(page, "Execute");
  await expect(page.getByLabel("Execution and learning loop").getByText(exportedScenario.mockOutput)).toBeVisible();

  await waitForStoredDemoStateField(page, "selectedScenarioId", exportedScenario.id);
  const importedState = await readStoredDemoState(page);
  expect(importedState.selectedScenarioId).toBe(exportedScenario.id);
  expect(importedState.governanceDecision).toBe("approved");
  expect(importedState.executionRuns).toHaveLength(1);
});

test("recovers to seeded state when persisted localStorage is malformed", async ({ page }) => {
  await page.evaluate((storageKey) => window.localStorage.setItem(storageKey, "{not-json"), DEMO_STORAGE_KEY);
  await page.reload();

  await expect(page.getByRole("heading", { name: "Enterprise Work Intelligence Console" })).toBeVisible();
  await expect(page.getByLabel("Operational summary").getByText(scenarios[0].label, { exact: true })).toBeVisible();
  await openView(page, "Analyze");
  await expect(page.getByRole("heading", { name: scenarios[0].graphTitle })).toHaveCount(0);
  await openView(page, "Execute");
  await expect(page.getByRole("button", { name: "Run simulation" })).toBeDisabled();

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
});

test("does not create horizontal overflow at 390px mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.reload();

  await runGoldenPath(page, scenarios[0]);

  const horizontalOverflow = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const scrollWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    const offenders = Array.from(document.body.querySelectorAll("*"))
      .map((element) => {
        const rect = element.getBoundingClientRect();

        return {
          tagName: element.tagName.toLowerCase(),
          className: typeof element.className === "string" ? element.className : "",
          ariaLabel: element.getAttribute("aria-label") ?? "",
          text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 80) ?? "",
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width)
        };
      })
      .filter((element) => element.right > viewportWidth + 1 || element.left < -1)
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
    `Horizontal overflow at 390px: ${JSON.stringify(horizontalOverflow, null, 2)}`
  ).toBeLessThanOrEqual(1);
});

async function runGoldenPath(page: Page, scenario: ScenarioExpectation) {
  await generateProposal(page, scenario);

  await page.getByLabel("Workflow controls").getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("Available").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Run simulation" })).toBeEnabled();

  await page.getByRole("button", { name: "Run simulation" }).click();
  await expect(page.getByRole("heading", { name: "Workflow runner" })).toBeVisible();
  await expect(page.getByText(scenario.mockOutput)).toBeVisible();
}

async function generateProposal(page: Page, scenario: ScenarioExpectation) {
  await page.getByLabel("Select workflow").selectOption(scenario.id);
  await expect(page.getByLabel("Operational summary").getByText(scenario.label, { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Load workflow" }).click();
  await expect(page.getByText("Raw traces")).toBeVisible();
  await expect(page.getByText("Cases")).toBeVisible();

  await page.getByRole("button", { name: "Analyze workflow" }).click();
  await expect(page.getByRole("heading", { name: scenario.graphTitle })).toBeVisible();
  await expect(page.getByRole("heading", { name: scenario.patternLabel })).toBeVisible();

  await page.getByRole("button", { name: "Generate automation proposal" }).click();
  await expect(page.getByRole("heading", { name: "Governed automation proposal" })).toBeVisible();
  await openView(page, "Govern");
  await expect(page.getByRole("heading", { name: "Review before execution" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Run simulation" })).toBeDisabled();
  await expect(page.getByText("Blocked").first()).toBeVisible();
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
  await page.getByLabel("Workflow controls").getByRole("button", { name: "Export Summary" }).click();

  const runSummary = page.getByRole("textbox", { name: "Execution summary JSON", exact: true });
  await expect(runSummary).not.toHaveValue("");

  return runSummary.inputValue();
}

async function resetDemo(page: Page, scenario: ScenarioExpectation) {
  await page.getByLabel("Workflow controls").getByRole("button", { name: "Reset workflow state" }).click();

  await expect(page.getByLabel("Operational summary").getByText(scenario.label, { exact: true })).toBeVisible();
  await openView(page, "Analyze");
  await expect(page.getByRole("heading", { name: scenario.graphTitle })).toHaveCount(0);
  await openView(page, "Plan");
  await expect(page.getByRole("heading", { name: "Governed automation proposal" })).toHaveCount(0);
  await openView(page, "Execute");
  await expect(page.getByRole("heading", { name: "Workflow runner" })).toHaveCount(0);
  await expect(page.getByText(scenario.mockOutput)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Run simulation" })).toBeDisabled();
}

async function openView(page: Page, name: string) {
  const navButton = page.getByRole("button", { name, exact: true });

  if (await navButton.isVisible()) {
    await navButton.click();
    return;
  }

  await page.getByLabel("Select app view").selectOption({ label: name });
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
