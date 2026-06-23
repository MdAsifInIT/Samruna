import { demoFixtures, demoScenarios } from "../fixtures/demoData";
import type { DemoFixtureSet, DemoScenario, FixtureValidationResult, ScenarioId, SourceChannel } from "./types";

const channels: SourceChannel[] = ["email", "ticket", "chat", "approval_log", "system_action"];

export function loadDemoFixtures(): DemoFixtureSet {
  return demoFixtures;
}

export function listDemoScenarios(): DemoScenario[] {
  return demoScenarios;
}

export function loadDemoScenario(scenarioId: ScenarioId = "it-access"): DemoScenario {
  const scenario = demoScenarios.find((item) => item.id === scenarioId);

  if (!scenario) {
    throw new Error(`Unknown demo scenario: ${scenarioId}`);
  }

  return scenario;
}

export function validateDemoFixtures(fixtures: DemoFixtureSet): FixtureValidationResult {
  const errors: string[] = [];
  const rawTraceIds = new Set<string>();
  const caseIds = new Set<string>();
  const channelCounts = Object.fromEntries(channels.map((channel) => [channel, 0])) as Record<SourceChannel, number>;

  for (const trace of fixtures.rawTraces) {
    if (rawTraceIds.has(trace.id)) {
      errors.push(`Duplicate raw trace id: ${trace.id}`);
    }

    rawTraceIds.add(trace.id);
    caseIds.add(trace.caseId);
    channelCounts[trace.channel] += 1;

    if (!trace.subject.trim()) {
      errors.push(`Trace ${trace.id} is missing subject`);
    }

    if (!trace.body.trim()) {
      errors.push(`Trace ${trace.id} is missing body`);
    }

    if (!trace.metadata.department.trim()) {
      errors.push(`Trace ${trace.id} is missing department metadata`);
    }
  }

  const approvalCaseIds = new Set(fixtures.approvalHistory.map((approval) => approval.caseId));

  for (const caseId of caseIds) {
    if (!approvalCaseIds.has(caseId)) {
      errors.push(`Case ${caseId} has no approval history`);
    }
  }

  if (!fixtures.policyRules.length) {
    errors.push("At least one policy rule is required");
  }

  for (const policyRule of fixtures.policyRules) {
    if (!policyRule.appliesTo.length) {
      errors.push(`Policy ${policyRule.id} does not apply to any request type`);
    }
  }

  if (!fixtures.newIncomingTrace.caseId || !fixtures.newIncomingTrace.body.trim()) {
    errors.push("New incoming request trace is incomplete");
  }

  return {
    valid: errors.length === 0,
    errors,
    summary: {
      rawTraceCount: fixtures.rawTraces.length,
      caseCount: caseIds.size,
      policyRuleCount: fixtures.policyRules.length,
      approvalRecordCount: fixtures.approvalHistory.length,
      channelCounts
    }
  };
}
