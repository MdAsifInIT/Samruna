const storageKey = "work-graph-foundry.demo-state.v1";
const scenarioId = process.argv[3] === "procurement-intake" ? "procurement-intake" : "it-access";
const command = process.argv[2] ?? "help";

const seedState = {
  version: 1,
  selectedScenarioId: scenarioId,
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
  updatedAt: "2026-05-16T09:00:00Z"
};

if (command === "seed") {
  console.log(JSON.stringify(seedState, null, 2));
  process.exit(0);
}

if (command === "reset") {
  console.log(`Browser localStorage key: ${storageKey}`);
  console.log("Run this in the local demo browser console, or click Reset in the app:");
  console.log(`localStorage.setItem(${JSON.stringify(storageKey)}, ${JSON.stringify(JSON.stringify(seedState))}); location.reload();`);
  process.exit(0);
}

console.log("Work Graph Foundry demo state helper");
console.log("");
console.log("Commands:");
console.log("  npm run demo:seed -- [it-access|procurement-intake]");
console.log("  npm run demo:reset -- [it-access|procurement-intake]");
