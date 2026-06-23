import {
  Activity,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  Database,
  Download,
  GitBranch,
  ListChecks,
  Network,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Upload,
  XCircle
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createAiProvider } from "./ai/providers";
import { recommendLearningUpdate, runApprovedWorkflow } from "./domain/execution";
import { listDemoScenarios, loadDemoScenario, validateDemoFixtures } from "./domain/fixtures";
import { buildWorkGraph } from "./domain/graph";
import { auditFromGovernance, canExecute, createAuditEvent, createGovernanceRecord } from "./domain/governance";
import { ingestWorkTraces } from "./domain/ingestion";
import { detectWorkPatterns } from "./domain/patterns";
import {
  createSeedDemoState,
  exportRunSummary,
  importRunSummary,
  loadPersistedDemoState,
  resetPersistedDemoState,
  saveDemoState,
  type PersistedDemoState
} from "./domain/persistence";
import { generateAutomationProposal } from "./domain/planner";
import { simulateAutomation } from "./domain/simulation";
import type {
  AuditEvent,
  DemoScenario,
  GovernanceRecord,
  IngestionResult,
  LearningRecommendation,
  ScenarioId,
  SourceChannel
} from "./domain/types";

const scenarioOptions = listDemoScenarios();

const channelLabels: Record<SourceChannel, string> = {
  email: "Email",
  ticket: "Tickets",
  chat: "Chat",
  approval_log: "Approvals",
  system_action: "System actions"
};

export function App() {
  const [demoState, setDemoState] = useState<PersistedDemoState>(
    () => loadPersistedDemoState() ?? createSeedDemoState()
  );
  const [exportText, setExportText] = useState("");
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const aiProvider = useMemo(() => createAiProvider(), []);
  const scenario = useMemo(() => loadDemoScenario(demoState.selectedScenarioId), [demoState.selectedScenarioId]);
  const fixtures = scenario.fixtures;
  const validation = useMemo(() => validateDemoFixtures(fixtures), [fixtures]);

  const ingestion = useMemo(
    () => (demoState.analysisRequested ? ingestWorkTraces(fixtures.rawTraces, fixtures.approvalHistory) : undefined),
    [demoState.analysisRequested, fixtures]
  );
  const graph = useMemo(() => (ingestion ? buildWorkGraph(ingestion.items) : undefined), [ingestion]);
  const patternDetection = useMemo(() => (ingestion ? detectWorkPatterns(ingestion.items) : undefined), [ingestion]);
  const sampleItem = ingestion?.items[0];
  const topPattern = patternDetection?.patterns[0];
  const topBottleneck = topPattern
    ? patternDetection?.bottlenecks.find((bottleneck) => bottleneck.patternId === topPattern.id)
    : undefined;
  const topOpportunity = topPattern
    ? patternDetection?.opportunities.find((opportunity) => opportunity.patternId === topPattern.id)
    : undefined;
  const proposal =
    demoState.proposalRequested && topPattern && graph && topBottleneck && topOpportunity
      ? generateAutomationProposal({
          pattern: topPattern,
          graph,
          policyRules: fixtures.policyRules,
          bottleneck: topBottleneck,
          opportunity: topOpportunity
        })
      : undefined;
  const simulation = proposal && ingestion ? simulateAutomation(proposal, ingestion.items) : undefined;
  const governanceRecords = useMemo(
    () => (proposal ? buildGovernanceRecords(proposal, demoState.governanceDecision) : []),
    [demoState.governanceDecision, proposal]
  );
  const executionReady = proposal ? canExecute(governanceRecords, proposal) : false;
  const executionRun =
    proposal && demoState.runRequested
      ? runApprovedWorkflow({
          proposal,
          requestTrace: fixtures.newIncomingTrace,
          approved: executionReady
        })
      : undefined;
  const learningRecommendation =
    simulation && executionRun ? recommendLearningUpdate({ simulation, execution: executionRun }) : undefined;
  const auditEvents = useMemo(
    () =>
      buildAuditEvents({
        state: demoState,
        scenario,
        ingestion,
        governanceRecords,
        executionStatus: executionRun?.status,
        recommendation: learningRecommendation
      }),
    [demoState, executionRun?.status, governanceRecords, ingestion, learningRecommendation, scenario]
  );
  const snapshot = useMemo<PersistedDemoState>(
    () => ({
      ...demoState,
      graph,
      proposals: proposal ? [proposal] : [],
      governanceRecords,
      simulation,
      executionRuns: executionRun ? [executionRun] : [],
      recommendations: learningRecommendation ? [learningRecommendation] : [],
      auditEvents,
      updatedAt: new Date().toISOString()
    }),
    [auditEvents, demoState, executionRun, governanceRecords, graph, learningRecommendation, proposal, simulation]
  );
  const topSystem = ingestion ? topEntry(ingestion.summary.systemCounts) : undefined;
  const foundationPanels = buildFoundationPanels(demoState, scenario, ingestion, proposal?.auditRationale);

  useEffect(() => {
    saveDemoState(snapshot);
  }, [snapshot]);

  const updateState = (updater: (state: PersistedDemoState) => PersistedDemoState) => {
    setDemoState((current) => updater({ ...current, updatedAt: new Date().toISOString() }));
  };

  const selectScenario = (scenarioId: ScenarioId) => {
    setDemoState(createSeedDemoState(scenarioId, new Date().toISOString()));
    setExportText("");
    setImportText("");
    setImportError("");
  };

  const resetDemo = () => {
    setDemoState(resetPersistedDemoState(demoState.selectedScenarioId));
    setExportText("");
    setImportText("");
    setImportError("");
  };

  const importSummary = () => {
    try {
      const imported = importRunSummary(importText);
      setDemoState(imported);
      saveDemoState(imported);
      setImportError("");
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Import failed");
    }
  };

  return (
    <main className="app-shell">
      <section className="topbar" aria-label="Demo controls">
        <div>
          <p className="eyebrow">Work Graph Foundry</p>
          <h1>Enterprise Work Intelligence Console</h1>
        </div>
        <div className="toolbar">
          <label className="scenario-picker">
            <span>Scenario</span>
            <select
              aria-label="Select demo scenario"
              value={demoState.selectedScenarioId}
              onChange={(event) => selectScenario(event.target.value as ScenarioId)}
            >
              {scenarioOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            aria-label="Load scenario"
            title="Load scenario"
            onClick={() =>
              updateState((state) => ({
                ...state,
                sampleLoaded: true
              }))
            }
          >
            <Database size={18} />
            <span>Load Scenario</span>
          </button>
          <button
            type="button"
            aria-label="Analyze workflow"
            title="Analyze workflow"
            disabled={!demoState.sampleLoaded}
            onClick={() =>
              updateState((state) => ({
                ...state,
                analysisRequested: true
              }))
            }
          >
            <Network size={18} />
            <span>Analyze</span>
          </button>
          <button
            type="button"
            aria-label="Generate automation proposal"
            title="Generate automation proposal"
            disabled={!demoState.analysisRequested}
            onClick={() =>
              updateState((state) => ({
                ...state,
                proposalRequested: true,
                governanceDecision: "pending"
              }))
            }
          >
            <Brain size={18} />
            <span>Generate Proposal</span>
          </button>
          <button
            type="button"
            aria-label="Run safe mock execution"
            title="Run safe mock execution"
            disabled={!demoState.proposalRequested}
            onClick={() =>
              updateState((state) => ({
                ...state,
                runRequested: true
              }))
            }
          >
            <Play size={18} />
            <span>Run Mock</span>
          </button>
          <button type="button" aria-label="Reset seeded demo state" title="Reset seeded demo state" onClick={resetDemo}>
            <RotateCcw size={18} />
            <span>Reset</span>
          </button>
        </div>
      </section>

      <section className="operator-console" aria-label="Scenario operator console">
        <div>
          <p className="eyebrow">Selected workflow</p>
          <h2>{scenario.workflowName}</h2>
          <p>{scenario.description}</p>
          <strong>{scenario.operatorGoal}</strong>
        </div>
        <div className="operator-card">
          <div className="panel-heading">
            <ListChecks size={18} />
            <h2>Operator path</h2>
          </div>
          <ol>
            <li data-complete={demoState.sampleLoaded}>Load scenario</li>
            <li data-complete={demoState.analysisRequested}>Analyze workflow</li>
            <li data-complete={Boolean(graph)}>Inspect graph and patterns</li>
            <li data-complete={demoState.proposalRequested}>Generate proposal</li>
            <li data-complete={demoState.governanceDecision === "approved"}>Approve or reject</li>
            <li data-complete={Boolean(executionRun)}>Run safe mock execution</li>
            <li data-complete={Boolean(learningRecommendation)}>View audit and recommendation</li>
          </ol>
        </div>
        <div className="operator-card">
          <div className="panel-heading">
            <ShieldAlert size={18} />
            <h2>Data boundary</h2>
          </div>
          <p>{scenario.syntheticDataNotice}</p>
          <dl>
            <div>
              <dt>Needs</dt>
              <dd>{scenario.requiredOrgData.slice(0, 4).join(", ")}</dd>
            </div>
            <div>
              <dt>Never needs</dt>
              <dd>{scenario.excludedOrgData.slice(0, 4).join(", ")}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="demo-strip" aria-label="Scripted demo path">
        <span data-active={demoState.sampleLoaded}>1 Load scenario</span>
        <span data-active={demoState.analysisRequested}>2 Analyze workflow</span>
        <span data-active={Boolean(graph)}>3 Inspect graph</span>
        <span data-active={demoState.proposalRequested}>4 Generate proposal</span>
        <span data-active={demoState.governanceDecision === "approved"}>5 Govern</span>
        <span data-active={Boolean(executionRun)}>6 Run mock</span>
        <span data-active={Boolean(learningRecommendation)}>7 Improve</span>
      </section>

      <section className="status-grid" aria-label="System status">
        <div className="metric">
          <Activity size={18} />
          <span>Scenario state</span>
          <strong>{demoState.sampleLoaded ? "Loaded" : "Seeded"}</strong>
        </div>
        <div className="metric">
          <Sparkles size={18} />
          <span>AI mode</span>
          <strong>{aiProvider.status.label}</strong>
        </div>
        <div className="metric">
          <ShieldCheck size={18} />
          <span>Execution</span>
          <strong>{executionReady ? "Approved gate" : "Governed gate"}</strong>
        </div>
        <div className="metric">
          <CheckCircle2 size={18} />
          <span>Fixture validation</span>
          <strong>{validation.valid ? "Valid" : "Needs review"}</strong>
        </div>
      </section>

      {demoState.sampleLoaded ? (
        <section className="ingestion-summary" aria-label="Loaded scenario summary">
          <div>
            <span>Raw traces</span>
            <strong>{validation.summary.rawTraceCount}</strong>
          </div>
          <div>
            <span>Cases</span>
            <strong>{validation.summary.caseCount}</strong>
          </div>
          <div>
            <span>Policies</span>
            <strong>{validation.summary.policyRuleCount}</strong>
          </div>
          <div>
            <span>Approval records</span>
            <strong>{validation.summary.approvalRecordCount}</strong>
          </div>
        </section>
      ) : null}

      {demoState.sampleLoaded ? (
        <section className="channel-strip" aria-label="Synthetic source channels">
          {Object.entries(validation.summary.channelCounts).map(([channel, count]) => (
            <span key={channel}>
              {channelLabels[channel as SourceChannel]}: <strong>{count}</strong>
            </span>
          ))}
        </section>
      ) : null}

      <section className="dashboard-grid" aria-label="Operating dashboard">
        {foundationPanels.map((panel) => {
          const Icon = panel.icon;
          return (
            <article className="panel" key={panel.title}>
              <div className="panel-heading">
                <Icon size={18} />
                <h2>{panel.title}</h2>
              </div>
              <p className="panel-value">{panel.value}</p>
              <p className="panel-detail">{panel.detail}</p>
            </article>
          );
        })}
      </section>

      {ingestion ? (
        <section className="ingestion-summary" aria-label="Ingestion summary">
          <div>
            <span>Normalized items</span>
            <strong>{ingestion.summary.normalizedItemCount}</strong>
          </div>
          <div>
            <span>Warnings</span>
            <strong>{ingestion.summary.issueCount}</strong>
          </div>
          <div>
            <span>{scenario.topSystemLabel}</span>
            <strong>{topSystem?.[0] ?? "None"}</strong>
          </div>
          <div>
            <span>Top system cases</span>
            <strong>{topSystem?.[1] ?? 0}</strong>
          </div>
        </section>
      ) : null}

      {sampleItem ? (
        <section className="evidence-panel" aria-label="Raw to normalized evidence">
          <div>
            <p className="eyebrow">Observed evidence</p>
            <h2>Raw trace to normalized work item</h2>
          </div>
          <div className="evidence-grid">
            <article>
              <h3>{fixtures.rawTraces[0].subject}</h3>
              <p>{fixtures.rawTraces[0].body}</p>
            </article>
            <article>
              <h3>{sampleItem.requester}</h3>
              <dl>
                <div>
                  <dt>Department</dt>
                  <dd>{sampleItem.requesterDepartment}</dd>
                </div>
                <div>
                  <dt>Request type</dt>
                  <dd>{sampleItem.requestType.replaceAll("_", " ")}</dd>
                </div>
                <div>
                  <dt>System</dt>
                  <dd>{sampleItem.systems.join(", ")}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{sampleItem.status.replaceAll("_", " ")}</dd>
                </div>
              </dl>
            </article>
          </div>
        </section>
      ) : null}

      {graph ? (
        <section className="graph-panel" aria-label="Generated work graph">
          <div className="graph-header">
            <div>
              <p className="eyebrow">Work graph</p>
              <h2>{scenario.graphTitle}</h2>
            </div>
            <div className="graph-metrics">
              <span>{graph.metrics.approvalDelayHours}h approval delay</span>
              <span>{Math.round(graph.metrics.exceptionRate * 100)}% exception rate</span>
              <span>{graph.metrics.averageCycleTimeHours}h cycle time</span>
            </div>
          </div>
          <ol className="graph-steps">
            {graph.nodes.map((node) => (
              <li key={node.id} data-risk={node.riskLevel}>
                <strong>{node.label}</strong>
                <span>
                  {node.count} cases · {node.kind}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {patternDetection ? (
        <section className="pattern-panel" aria-label="Detected work patterns">
          <div className="graph-header">
            <div>
              <p className="eyebrow">Pattern detection</p>
              <h2>Repeated workflows and automation opportunities</h2>
            </div>
            {topOpportunity ? (
              <strong className="opportunity-score">{Math.round(topOpportunity.score * 100)} opportunity</strong>
            ) : null}
          </div>
          <div className="pattern-grid">
            <div className="pattern-list">
              {patternDetection.patterns.map((pattern) => (
                <article key={pattern.id} className={pattern.id === topPattern?.id ? "selected" : undefined}>
                  <strong>{pattern.label}</strong>
                  <span>
                    {pattern.volume} cases · {Math.round(pattern.repeatabilityScore * 100)} repeatability · {pattern.riskLevel} risk
                  </span>
                </article>
              ))}
            </div>
            <div className="insight-card">
              <h3>{topBottleneck?.label}</h3>
              <p>{topBottleneck?.evidence}</p>
              <dl>
                <div>
                  <dt>Average delay</dt>
                  <dd>{topBottleneck?.averageDelayHours}h</dd>
                </div>
                <div>
                  <dt>Value</dt>
                  <dd>{topOpportunity?.valueSummary}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      ) : null}

      {proposal ? (
        <section className="proposal-panel" aria-label="Automation proposal">
          <div className="graph-header">
            <div>
              <p className="eyebrow">Agentic workflow planner</p>
              <h2>Governed automation proposal</h2>
            </div>
            <strong className="opportunity-score">{Math.round(proposal.confidence * 100)} confidence</strong>
          </div>
          <div className="proposal-grid">
            <article>
              <h3>Trigger</h3>
              <p>{proposal.trigger}</p>
            </article>
            <article>
              <h3>Required data</h3>
              <ul>
                {proposal.requiredData.slice(0, 5).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article>
              <h3>Policy checks</h3>
              <ul>
                {proposal.policyChecks.map((check) => (
                  <li key={check}>{check}</li>
                ))}
              </ul>
            </article>
            <article>
              <h3>Actions</h3>
              <ul>
                {proposal.actions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </article>
            <article>
              <h3>Escalations</h3>
              <ul>
                {proposal.escalations.map((escalation) => (
                  <li key={escalation}>{escalation}</li>
                ))}
              </ul>
            </article>
            <article>
              <h3>AI assumptions</h3>
              <ul>
                <li>{aiProvider.status.label} is the active provider.</li>
                <li>Inputs are synthetic workflow metadata and approvals.</li>
                <li>Mock execution cannot mutate external systems.</li>
              </ul>
            </article>
          </div>
          <p className="audit-rationale">{proposal.auditRationale}</p>
        </section>
      ) : null}

      {simulation && proposal ? (
        <section className="simulation-panel" aria-label="Simulation and governance">
          <div className="graph-header">
            <div>
              <p className="eyebrow">Simulation and governance</p>
              <h2>Historical replay before execution</h2>
            </div>
            <div className="governance-actions">
              <button
                className="approve-button"
                type="button"
                onClick={() =>
                  updateState((state) => ({
                    ...state,
                    governanceDecision: "approved"
                  }))
                }
              >
                <ShieldCheck size={16} />
                <span>{demoState.governanceDecision === "approved" ? "Approved" : "Approve"}</span>
              </button>
              <button
                className="reject-button"
                type="button"
                onClick={() =>
                  updateState((state) => ({
                    ...state,
                    governanceDecision: "rejected"
                  }))
                }
              >
                <XCircle size={16} />
                <span>{demoState.governanceDecision === "rejected" ? "Rejected" : "Reject"}</span>
              </button>
            </div>
          </div>
          <div className="simulation-grid">
            <article>
              <span>Pass</span>
              <strong>{simulation.passed}</strong>
            </article>
            <article>
              <span>Needs human</span>
              <strong>{simulation.needsHuman}</strong>
            </article>
            <article>
              <span>Policy risk</span>
              <strong>{simulation.policyRisk}</strong>
            </article>
            <article>
              <span>Execution gate</span>
              <strong>{executionReady ? "Open" : "Blocked"}</strong>
            </article>
            <article>
              <span>Avoided delay</span>
              <strong>{simulation.avoidedDelayHours}h</strong>
            </article>
          </div>
          <div className="audit-log">
            <h3>Governance and security notes</h3>
            <p>
              <strong>Data access</strong> · Needs workflow metadata, timestamps, status changes, owners, approvals, comments if
              available, and system identifiers.
            </p>
            <p>
              <strong>Forbidden data</strong> · Does not need passwords, raw secrets, private message bodies, production write
              access, or unrestricted admin access.
            </p>
            <p>
              <strong>Approval rule</strong> · Execution opens only when an approved record exists for proposal version{" "}
              {proposal.version}.
            </p>
          </div>
        </section>
      ) : null}

      {proposal ? (
        <section className="execution-panel" aria-label="Execution and learning loop">
          <div className="graph-header">
            <div>
              <p className="eyebrow">Execution layer</p>
              <h2>Approved workflow runner</h2>
            </div>
            <strong className="opportunity-score">{executionRun?.status ?? "ready"}</strong>
          </div>
          <div className="execution-grid">
            <article>
              <h3>Incoming request</h3>
              <p>{fixtures.newIncomingTrace.body}</p>
            </article>
            <article>
              <h3>Mock tool calls</h3>
              {executionRun?.mockToolCalls.length ? (
                <ul>
                  {executionRun.mockToolCalls.map((call) => (
                    <li key={call.tool}>
                      <strong>{call.tool}</strong>: {call.output}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>{executionRun ? executionRun.auditTrail[0] : "Run the new case after approval."}</p>
              )}
            </article>
            <article>
              <h3>Learning loop</h3>
              <p>
                {learningRecommendation
                  ? `${learningRecommendation.recommendation} ${learningRecommendation.expectedImpact}`
                  : "Learning recommendation appears after a mock execution run."}
              </p>
            </article>
          </div>
        </section>
      ) : null}

      <section className="audit-panel" aria-label="Audit trail and run summary">
        <div className="graph-header">
          <div>
            <p className="eyebrow">Audit trail</p>
            <h2>Persisted demo state and reviewable agent behavior</h2>
          </div>
          <div className="governance-actions">
            <button className="export-button" type="button" onClick={() => setExportText(exportRunSummary(snapshot))}>
              <Download size={16} />
              <span>Export Summary</span>
            </button>
            <button className="export-button" type="button" onClick={importSummary} disabled={!importText.trim()}>
              <Upload size={16} />
              <span>Import Summary</span>
            </button>
          </div>
        </div>
        <div className="audit-grid">
          <article>
            <h3>Audit events</h3>
            {auditEvents.length ? (
              auditEvents.map((event) => (
                <p key={event.id}>
                  <strong>{event.action}</strong> · {event.actor.replaceAll("_", " ")} · {event.detail}
                </p>
              ))
            ) : (
              <p>No run events yet. Load the scenario to begin the audit trail.</p>
            )}
          </article>
          <article>
            <h3>Run summary export</h3>
            <textarea
              aria-label="Run summary JSON"
              value={exportText}
              onChange={(event) => setExportText(event.target.value)}
              placeholder="Exported run summary JSON appears here."
            />
          </article>
          <article>
            <h3>Import summary</h3>
            <textarea
              aria-label="Import run summary JSON"
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              placeholder="Paste a Work Graph Foundry run summary JSON to restore a demo state."
            />
            {importError ? <p className="import-error">{importError}</p> : null}
          </article>
        </div>
      </section>
    </main>
  );
}

function buildGovernanceRecords(proposal: NonNullable<ReturnType<typeof generateAutomationProposal>>, decision: string) {
  const pending = createGovernanceRecord({
    proposal,
    decision: "pending",
    reviewerRole: "process_owner",
    comments: "Process owner review opened for governed workflow automation.",
    timestamp: "2026-05-16T10:00:00Z"
  });

  if (decision === "approved") {
    return [
      pending,
      createGovernanceRecord({
        proposal,
        decision: "approved",
        reviewerRole: "compliance",
        comments: "Approved for low-risk requests with exception escalation and audit logging.",
        timestamp: "2026-05-16T11:00:00Z"
      })
    ];
  }

  if (decision === "rejected") {
    return [
      pending,
      createGovernanceRecord({
        proposal,
        decision: "rejected",
        reviewerRole: "compliance",
        comments: "Rejected pending additional control evidence before mock execution.",
        timestamp: "2026-05-16T11:00:00Z"
      })
    ];
  }

  return [pending];
}

function buildAuditEvents(input: {
  state: PersistedDemoState;
  scenario: DemoScenario;
  ingestion?: IngestionResult;
  governanceRecords: GovernanceRecord[];
  executionStatus?: string;
  recommendation?: LearningRecommendation;
}): AuditEvent[] {
  const events: AuditEvent[] = [];

  if (input.state.sampleLoaded) {
    events.push(
      createAuditEvent({
        id: `audit-${input.scenario.id}-loaded`,
        timestamp: "2026-05-16T09:05:00Z",
        actor: "demo_operator",
        action: "Scenario loaded",
        detail: `${input.scenario.label} fixture set loaded from synthetic local data.`
      })
    );
  }

  if (input.state.analysisRequested && input.ingestion) {
    events.push(
      createAuditEvent({
        id: `audit-${input.scenario.id}-analysis`,
        timestamp: "2026-05-16T09:20:00Z",
        actor: "observer_agent",
        action: "Workflow analyzed",
        detail: `${input.ingestion.summary.normalizedItemCount} work items normalized with ${input.ingestion.summary.issueCount} warnings.`
      })
    );
  }

  if (input.state.proposalRequested) {
    events.push(
      createAuditEvent({
        id: `audit-${input.scenario.id}-proposal`,
        timestamp: "2026-05-16T09:40:00Z",
        actor: "planner_agent",
        action: "Proposal generated",
        detail: "Proposal inputs, assumptions, policy checks, actions, and escalations were made reviewable."
      })
    );
  }

  events.push(...input.governanceRecords.map(auditFromGovernance));

  if (input.executionStatus) {
    events.push(
      createAuditEvent({
        id: `audit-${input.scenario.id}-execution-${input.executionStatus}`,
        timestamp: "2026-05-16T11:20:00Z",
        actor: "executor_agent",
        action: "Mock execution run",
        detail: `Safe mock execution finished with status ${input.executionStatus}.`
      })
    );
  }

  if (input.recommendation) {
    events.push(
      createAuditEvent({
        id: `audit-${input.scenario.id}-learning`,
        timestamp: "2026-05-16T11:30:00Z",
        actor: "learner_agent",
        action: "Recommendation created",
        detail: input.recommendation.recommendation
      })
    );
  }

  return events;
}

function buildFoundationPanels(
  state: PersistedDemoState,
  scenario: DemoScenario,
  ingestion?: IngestionResult,
  proposalRationale?: string
) {
  return [
    {
      title: "Scenario Dataset",
      icon: Database,
      value: state.sampleLoaded ? scenario.label : "Seeded baseline",
      detail: state.sampleLoaded
        ? scenario.syntheticDataNotice
        : "Load the selected scenario to inspect typed synthetic traces."
    },
    {
      title: "Work Pattern Clusters",
      icon: Network,
      value: ingestion ? `${ingestion.summary.normalizedItemCount} normalized items` : "Awaiting analysis",
      detail: ingestion
        ? "Repeated work patterns, exceptions, and bottlenecks are ready for inspection."
        : "Analyze the workflow after loading a scenario."
    },
    {
      title: "Work Graph",
      icon: GitBranch,
      value: state.analysisRequested ? "Graph generated" : "Graph canvas ready",
      detail: "Actors, approvals, policy checks, system actions, exceptions, and outcomes."
    },
    {
      title: "Agentic Planner",
      icon: Brain,
      value: state.proposalRequested ? "Proposal generated" : "Mock provider default",
      detail: proposalRationale ?? "Structured automation proposals are generated from graph insights."
    },
    {
      title: "Governance",
      icon: ShieldCheck,
      value: state.governanceDecision === "approved" ? "Approved" : state.governanceDecision === "rejected" ? "Rejected" : "Pending",
      detail: "Execution remains blocked until an approved proposal exists."
    },
    {
      title: "Persistence",
      icon: ClipboardCheck,
      value: "Local state saved",
      detail: "Scenario, generated artifacts, decisions, execution results, recommendations, and audits persist in this browser."
    }
  ];
}

function topEntry(counts: Record<string, number>): [string, number] | undefined {
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
}
