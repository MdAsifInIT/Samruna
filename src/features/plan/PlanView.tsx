import { GitBranch } from "lucide-react";
import { EmptyState } from "../../components/shared/EmptyState";
import { formatProposalTimestamp, type WorkGraphDemoController } from "../../app/useWorkGraphDemoController";

interface PlanViewProps {
  controller: WorkGraphDemoController;
}

export function PlanView({ controller }: PlanViewProps) {
  const { actions, proposal, proposalGenerationReady, proposalVersions, scenario } = controller;

  return (
    <>
      <section className="view-heading">
        <p className="eyebrow">Plan</p>
        <h2>Proposal generation and change planning</h2>
      </section>

      {proposal ? (
        <section className="proposal-panel" aria-label="Automation proposal">
          <div className="graph-header">
            <div>
              <p className="eyebrow">Planner</p>
              <h2>Governed automation proposal</h2>
            </div>
            <div className="proposal-version-controls">
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
              <strong className="opportunity-score">{Math.round(proposal.confidence * 100)} confidence</strong>
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
          </div>
          <div className="proposal-summary">
            <div>
              <span>Trigger</span>
              <strong>{proposal.trigger}</strong>
            </div>
            <div>
              <span>Risk</span>
              <strong>{proposal.riskLevel}</strong>
            </div>
            <div>
              <span>Version</span>
              <strong>v{proposal.version}</strong>
            </div>
            <div>
              <span>Generated</span>
              <strong>{formatProposalTimestamp(proposal.generatedAt)}</strong>
            </div>
            <div>
              <span>Expected value</span>
              <strong>{proposal.expectedValue}</strong>
            </div>
            <div>
              <span>Change summary</span>
              <strong>{proposal.changeSummary ?? "Generated proposal baseline."}</strong>
            </div>
          </div>
          <div className="proposal-grid">
            <article>
              <h3>Required data</h3>
              <ul>
                {proposal.requiredData.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article>
              <h3>Forbidden data</h3>
              <ul>
                {scenario.excludedOrgData.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article>
              <h3>Eligibility rules</h3>
              <ul>
                {proposal.eligibilityRules.map((rule) => (
                  <li key={rule}>{rule}</li>
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
          </div>
          <p className="audit-rationale">{proposal.auditRationale}</p>
        </section>
      ) : (
        <EmptyState title="No proposal generated" action="Analyze the workflow, then Generate Proposal from the command bar." />
      )}
    </>
  );
}
