import { GitBranch, Play, ShieldCheck, XCircle } from "lucide-react";
import { formatProposalTimestamp, type WorkGraphDemoController } from "../../app/useWorkGraphDemoController";
import { EmptyState } from "../../components/shared/EmptyState";

interface ReviewRunViewProps {
  controller: WorkGraphDemoController;
}

export function ReviewRunView({ controller }: ReviewRunViewProps) {
  const {
    actions,
    aiProvider,
    demoState,
    executionGateCopy,
    executionGateLabel,
    executionReady,
    executionRun,
    fixtures,
    governanceDecisionLabel,
    learningRecommendation,
    proposal,
    providerFallbackMessage,
    providerStatusDetail,
    providerStatusLabel,
    proposalGenerationReady,
    proposalVersions,
    scenario,
    simulation,
    simulationCasePreview
  } = controller;

  if (!proposal || !simulation) {
    return (
      <section className="review-run-panel" aria-label="Review and run workflow">
        <EmptyState
          title="No proposal generated"
          action="Load and analyze the workflow, then generate a backend-backed proposal from the command bar."
        />
      </section>
    );
  }

  return (
    <section className="review-run-panel" aria-label="Review and run workflow">
      <div className="review-run-header">
        <div>
          <h2>Is the automation safe to approve and run?</h2>
          <p>{proposal.auditRationale}</p>
        </div>
        <div className="review-run-actions" aria-label="Proposal governance actions">
          <button className="approve-button" type="button" onClick={actions.approveProposal}>
            <ShieldCheck size={16} />
            <span>{demoState.governanceDecision === "approved" ? "Approved" : "Approve"}</span>
          </button>
          <button className="reject-button" type="button" onClick={actions.rejectProposal}>
            <XCircle size={16} />
            <span>{demoState.governanceDecision === "rejected" ? "Rejected" : "Reject"}</span>
          </button>
          <button
            className="toolbar-button-run"
            type="button"
            disabled={!executionReady}
            onClick={actions.runMockExecution}
          >
            <Play size={16} />
            <span>Run mock simulation</span>
          </button>
        </div>
      </div>

      <div className="proposal-provider-card" aria-label="Proposal provider provenance">
        <div>
          <span>Proposal source</span>
          <strong>{providerStatusLabel}</strong>
        </div>
        <p>{providerFallbackMessage || providerStatusDetail}</p>
      </div>

      <div className="review-run-status" data-decision={demoState.governanceDecision}>
        <div>
          <span>Governance</span>
          <strong>{governanceDecisionLabel}</strong>
        </div>
        <div>
          <span>Execution gate</span>
          <strong>
            {executionReady && !executionRun
              ? "Available"
              : demoState.governanceDecision === "rejected"
                ? executionGateLabel
                : "Blocked"}
          </strong>
        </div>
        <div>
          <span>Simulation</span>
          <strong>{simulation.passed} passed</strong>
        </div>
        <div>
          <span>Avoided delay</span>
          <strong>{simulation.avoidedDelayHours}h</strong>
        </div>
        <div>
          <span>Enterprise execution</span>
          <strong>Mock only</strong>
        </div>
      </div>

      <div className="review-run-version">
        <label>
          <span>Version</span>
          <select
            aria-label="Select proposal version"
            value={proposal.id}
            onChange={(event) => actions.selectProposalVersion(event.target.value)}
          >
            {proposalVersions.map((versionedProposal) => (
              <option key={versionedProposal.id} value={versionedProposal.id}>
                v{versionedProposal.version} - {versionedProposal.changeSummary ?? "Generated proposal"}
              </option>
            ))}
          </select>
        </label>
        <button
          className="revision-button"
          type="button"
          disabled={!proposalGenerationReady}
          onClick={actions.createSelectedProposalRevision}
        >
          <GitBranch size={16} />
          <span>Create Revision</span>
        </button>
      </div>

      <div className="review-run-grid">
        <article>
          <h3>Governed automation proposal</h3>
          <dl>
            <div>
              <dt>Trigger</dt>
              <dd>{proposal.trigger}</dd>
            </div>
            <div>
              <dt>Risk</dt>
              <dd>{proposal.riskLevel}</dd>
            </div>
            <div>
              <dt>Confidence</dt>
              <dd>{Math.round(proposal.confidence * 100)}%</dd>
            </div>
            <div>
              <dt>Generated</dt>
              <dd>{formatProposalTimestamp(proposal.generatedAt)}</dd>
            </div>
            <div>
              <dt>Provider</dt>
              <dd>{aiProvider.status.lastInvocation?.providerLabel ?? aiProvider.status.label}</dd>
            </div>
            <div>
              <dt>Model</dt>
              <dd>{aiProvider.status.lastInvocation?.model ?? aiProvider.status.model ?? "Not configured"}</dd>
            </div>
            <div>
              <dt>Validation</dt>
              <dd>{aiProvider.status.lastInvocation?.validationStatus ?? "Not generated yet"}</dd>
            </div>
          </dl>
          <h4>Required data</h4>
          <ul>
            {proposal.requiredData.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h4>Forbidden data</h4>
          <ul>
            {scenario.excludedOrgData.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article>
          <h3>Review before execution</h3>
          <div className="simulation-grid simulation-grid-compact">
            <div>
              <span>Human review</span>
              <strong>{simulation.needsHuman}</strong>
            </div>
            <div>
              <span>Policy concern</span>
              <strong>{simulation.policyRisk}</strong>
            </div>
          </div>
          <div className="simulation-case-preview simulation-case-preview-compact" aria-label="Case-level simulation preview">
            {simulationCasePreview.map((caseResult) => (
              <section key={caseResult.caseId}>
                <span>{caseResult.caseId}</span>
                <strong>{caseResult.statusLabel}</strong>
                <p>{caseResult.reason}</p>
              </section>
            ))}
          </div>
          <h4>Actions</h4>
          <ul>
            {proposal.actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </article>

        <article>
          <h3>Workflow runner</h3>
          <p className="execution-boundary">{executionGateCopy}</p>
          <p className="execution-boundary execution-boundary-mock">
            Mock simulation only. No enterprise connector, provisioning system, or customer workflow is modified.
          </p>
          <h4>Incoming request</h4>
          <p>{fixtures.newIncomingTrace.body}</p>
          <h4>Simulated tool calls</h4>
          {executionRun?.mockToolCalls.length ? (
            <ul>
              {executionRun.mockToolCalls.map((call) => (
                <li key={call.tool}>
                  <strong>{call.tool}</strong>: {call.output}
                </li>
              ))}
            </ul>
          ) : (
            <p>
              {executionReady
                ? "Run the mock simulation to generate simulated tool calls."
                : demoState.governanceDecision === "rejected"
                  ? "Mock execution is blocked by rejection until the proposal is revised and approved."
                  : "Mock execution is blocked until approval opens the gate."}
            </p>
          )}
          <h4>Learning loop</h4>
          <p>
            {learningRecommendation
              ? `${learningRecommendation.recommendation} ${learningRecommendation.expectedImpact}`
              : "Learning recommendation appears after a mock run."}
          </p>
        </article>
      </div>

      {executionRun ? (
        <div className="execution-audit">
          <h3>Execution audit trail</h3>
          <ol>
            {executionRun.auditTrail.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}
