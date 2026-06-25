import { ShieldCheck, XCircle } from "lucide-react";
import { EmptyState } from "../../components/shared/EmptyState";
import type { WorkGraphDemoController } from "../../app/useWorkGraphDemoController";

interface GovernViewProps {
  controller: WorkGraphDemoController;
}

export function GovernView({ controller }: GovernViewProps) {
  const {
    actions,
    demoState,
    executionGateLabel,
    executionReady,
    governanceDecisionLabel,
    proposal,
    simulation,
    simulationCasePreview
  } = controller;

  return (
    <>
      <section className="view-heading">
        <p className="eyebrow">Govern</p>
        <h2>Compliance and approval</h2>
      </section>

      {simulation && proposal ? (
        <section className="simulation-panel" aria-label="Simulation and governance">
          <div className="graph-header">
            <div>
              <p className="eyebrow">Governance</p>
              <h2>Review before execution</h2>
            </div>
            <div className="governance-actions">
              <button className="approve-button" type="button" disabled={!proposal} onClick={actions.approveProposal}>
                <ShieldCheck size={16} />
                <span>{demoState.governanceDecision === "approved" ? "Approved" : "Approve"}</span>
              </button>
              <button className="reject-button" type="button" disabled={!proposal} onClick={actions.rejectProposal}>
                <XCircle size={16} />
                <span>{demoState.governanceDecision === "rejected" ? "Rejected" : "Reject"}</span>
              </button>
            </div>
          </div>
          <div className="governance-summary" data-decision={demoState.governanceDecision}>
            <div>
              <span>Governance gate</span>
              <strong>{governanceDecisionLabel}</strong>
            </div>
            <div>
              <span>Approval gate</span>
              <strong>{executionReady ? "Available" : "Blocked"}</strong>
            </div>
            <div>
              <span>Policy context</span>
              <strong>{proposal.riskLevel} risk</strong>
            </div>
            <div>
              <span>Review version</span>
              <strong>v{proposal.version}</strong>
            </div>
          </div>
          <div className="simulation-grid">
            <article>
              <span>Passed</span>
              <strong>{simulation.passed}</strong>
            </article>
            <article>
              <span>Requires human review</span>
              <strong>{simulation.needsHuman}</strong>
            </article>
            <article>
              <span>Policy concern</span>
              <strong>{simulation.policyRisk}</strong>
            </article>
            <article>
              <span>Execution gate</span>
              <strong>{executionGateLabel}</strong>
            </article>
            <article>
              <span>Avoided delay</span>
              <strong>{simulation.avoidedDelayHours}h</strong>
            </article>
          </div>
          <div className="simulation-case-preview" aria-label="Case-level simulation preview">
            {simulationCasePreview.map((caseResult) => (
              <article key={caseResult.caseId}>
                <span>{caseResult.caseId}</span>
                <strong>{caseResult.statusLabel}</strong>
                <p>{caseResult.reason}</p>
              </article>
            ))}
          </div>
          <div className="audit-log">
            <h3>Review notes</h3>
            <p>
              <strong>Inputs</strong> · Workflow metadata, timestamps, status changes, owners, approvals, comments, and system
              identifiers.
            </p>
            <p>
              <strong>Safety</strong> · No passwords, raw secrets, private messages, production writes, or unrestricted admin
              access; execution stays synthetic and read-only.
            </p>
          </div>
        </section>
      ) : (
        <EmptyState title="Governance not ready" action="Generate Proposal to run simulation and access review controls." />
      )}
    </>
  );
}
