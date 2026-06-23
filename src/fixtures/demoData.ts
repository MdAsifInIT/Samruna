import type {
  ApprovalHistoryRecord,
  DemoScenario,
  DemoFixtureSet,
  PolicyRule,
  RawWorkTrace,
  RequestType,
  SourceChannel,
  Urgency
} from "../domain/types";

interface CaseSeed {
  id: string;
  requester: string;
  department: string;
  manager: string;
  system: string;
  requestType: RequestType;
  urgency: Urgency;
  region: string;
  submittedAt: string;
  approvedAt: string;
  completedAt?: string;
  exception?: string;
  outcome: "approved" | "manual_review" | "rejected";
}

const seeds: CaseSeed[] = [
  {
    id: "case-1001",
    requester: "Maya Chen",
    department: "Revenue Operations",
    manager: "Ari Patel",
    system: "Salesforce",
    requestType: "standard_access",
    urgency: "normal",
    region: "NA",
    submittedAt: "2026-05-01T09:14:00Z",
    approvedAt: "2026-05-02T15:20:00Z",
    completedAt: "2026-05-02T16:05:00Z",
    outcome: "approved"
  },
  {
    id: "case-1002",
    requester: "Jon Bell",
    department: "Finance",
    manager: "Priya Shah",
    system: "NetSuite",
    requestType: "finance_system_access",
    urgency: "high",
    region: "NA",
    submittedAt: "2026-05-01T11:42:00Z",
    approvedAt: "2026-05-03T18:10:00Z",
    completedAt: "2026-05-04T10:30:00Z",
    exception: "quarter_close_urgency",
    outcome: "manual_review"
  },
  {
    id: "case-1003",
    requester: "Elena Ruiz",
    department: "Customer Success",
    manager: "Nora Ellis",
    system: "Zendesk",
    requestType: "standard_access",
    urgency: "normal",
    region: "EMEA",
    submittedAt: "2026-05-02T08:20:00Z",
    approvedAt: "2026-05-06T12:04:00Z",
    completedAt: "2026-05-06T13:12:00Z",
    outcome: "approved"
  },
  {
    id: "case-1004",
    requester: "Owen Brooks",
    department: "Engineering",
    manager: "Samira Khan",
    system: "GitHub Enterprise",
    requestType: "privileged_access",
    urgency: "normal",
    region: "NA",
    submittedAt: "2026-05-03T14:05:00Z",
    approvedAt: "2026-05-04T14:40:00Z",
    exception: "privileged_repository_admin",
    outcome: "manual_review"
  },
  {
    id: "case-1005",
    requester: "Iris Wu",
    department: "People",
    manager: "Devon Lane",
    system: "Workday",
    requestType: "standard_access",
    urgency: "low",
    region: "APAC",
    submittedAt: "2026-05-04T04:10:00Z",
    approvedAt: "2026-05-05T06:34:00Z",
    completedAt: "2026-05-05T08:00:00Z",
    outcome: "approved"
  },
  {
    id: "case-1006",
    requester: "Ravi Menon",
    department: "Marketing",
    manager: "Ari Patel",
    system: "Looker",
    requestType: "analytics_access",
    urgency: "normal",
    region: "APAC",
    submittedAt: "2026-05-05T06:50:00Z",
    approvedAt: "2026-05-08T09:18:00Z",
    completedAt: "2026-05-08T10:02:00Z",
    outcome: "approved"
  },
  {
    id: "case-1007",
    requester: "Tessa Green",
    department: "Legal",
    manager: "Marin Ito",
    system: "ContractWorks",
    requestType: "contractor_access",
    urgency: "normal",
    region: "EMEA",
    submittedAt: "2026-05-06T10:22:00Z",
    approvedAt: "2026-05-07T15:44:00Z",
    exception: "contractor_end_date_missing",
    outcome: "manual_review"
  },
  {
    id: "case-1008",
    requester: "Miles Carter",
    department: "Sales",
    manager: "Nora Ellis",
    system: "Salesforce",
    requestType: "standard_access",
    urgency: "high",
    region: "NA",
    submittedAt: "2026-05-06T13:11:00Z",
    approvedAt: "2026-05-10T16:30:00Z",
    completedAt: "2026-05-10T17:15:00Z",
    outcome: "approved"
  },
  {
    id: "case-1009",
    requester: "Anika Rao",
    department: "Revenue Operations",
    manager: "Ari Patel",
    system: "Salesforce",
    requestType: "standard_access",
    urgency: "normal",
    region: "APAC",
    submittedAt: "2026-05-07T05:18:00Z",
    approvedAt: "2026-05-11T08:42:00Z",
    completedAt: "2026-05-11T09:35:00Z",
    outcome: "approved"
  },
  {
    id: "case-1010",
    requester: "Noah Stein",
    department: "Engineering",
    manager: "Samira Khan",
    system: "GitHub Enterprise",
    requestType: "standard_access",
    urgency: "normal",
    region: "EMEA",
    submittedAt: "2026-05-08T12:02:00Z",
    approvedAt: "2026-05-09T14:14:00Z",
    completedAt: "2026-05-09T15:00:00Z",
    outcome: "approved"
  },
  {
    id: "case-1011",
    requester: "Keiko Tan",
    department: "Finance",
    manager: "Priya Shah",
    system: "NetSuite",
    requestType: "finance_system_access",
    urgency: "normal",
    region: "APAC",
    submittedAt: "2026-05-09T03:44:00Z",
    approvedAt: "2026-05-13T07:30:00Z",
    exception: "segregation_of_duties_review",
    outcome: "manual_review"
  },
  {
    id: "case-1012",
    requester: "Grace Miller",
    department: "Customer Success",
    manager: "Nora Ellis",
    system: "Zendesk",
    requestType: "standard_access",
    urgency: "low",
    region: "NA",
    submittedAt: "2026-05-10T15:28:00Z",
    approvedAt: "2026-05-12T19:08:00Z",
    completedAt: "2026-05-12T20:11:00Z",
    outcome: "approved"
  },
  {
    id: "case-1013",
    requester: "Mateo Silva",
    department: "Marketing",
    manager: "Devon Lane",
    system: "Looker",
    requestType: "analytics_access",
    urgency: "high",
    region: "LATAM",
    submittedAt: "2026-05-11T13:25:00Z",
    approvedAt: "2026-05-15T17:18:00Z",
    completedAt: "2026-05-15T18:01:00Z",
    exception: "campaign_launch_urgency",
    outcome: "approved"
  }
];

export const policyRules: PolicyRule[] = [
  {
    id: "policy-standard-access",
    label: "Standard application access",
    description: "Standard employee requests require active employment, manager approval, and approved application catalog membership.",
    appliesTo: ["standard_access", "analytics_access"],
    riskLevel: "low",
    requiresHumanReview: false,
    escalationRole: "manager"
  },
  {
    id: "policy-privileged-access",
    label: "Privileged access review",
    description: "Privileged access requires security review and system owner confirmation before provisioning.",
    appliesTo: ["privileged_access"],
    riskLevel: "high",
    requiresHumanReview: true,
    escalationRole: "security"
  },
  {
    id: "policy-contractor-access",
    label: "Contractor access expiry",
    description: "Contractor access requires end date and compliance review for data-sensitive systems.",
    appliesTo: ["contractor_access"],
    riskLevel: "medium",
    requiresHumanReview: true,
    escalationRole: "compliance"
  },
  {
    id: "policy-finance-access",
    label: "Finance system access",
    description: "Finance system access requires manager approval and audit note for quarter-close exceptions.",
    appliesTo: ["finance_system_access"],
    riskLevel: "medium",
    requiresHumanReview: true,
    escalationRole: "it_operations"
  }
];

function makeTrace(seed: CaseSeed, channel: SourceChannel, index: number): RawWorkTrace {
  const ticketId = `IT-${seed.id.replace("case-", "")}`;
  const occurredAt =
    channel === "email"
      ? seed.submittedAt
      : channel === "approval_log"
        ? seed.approvedAt
        : channel === "system_action" && seed.completedAt
          ? seed.completedAt
          : seed.submittedAt;

  const subjectByChannel: Record<SourceChannel, string> = {
    email: `Access request for ${seed.system}`,
    ticket: `${ticketId}: ${seed.requester} needs ${seed.system}`,
    chat: `Follow-up on ${seed.system} access`,
    approval_log: `${seed.manager} approval for ${seed.system}`,
    system_action: `${seed.system} provisioning update`
  };

  const bodyByChannel: Record<SourceChannel, string> = {
    email: `${seed.requester} from ${seed.department} requested ${seed.system} access with ${seed.urgency} urgency in ${seed.region}.`,
    ticket: `Catalog request ${ticketId} is categorized as ${seed.requestType}. ${seed.exception ? `Exception noted: ${seed.exception}.` : "No exception noted."}`,
    chat: `${seed.requester} asked IT for status because manager approval is the gating step.`,
    approval_log: `${seed.manager} approved request ${ticketId} for ${seed.requester}.`,
    system_action:
      seed.outcome === "approved"
        ? `IT provisioned ${seed.system} and wrote audit log for ${ticketId}.`
        : `IT routed ${ticketId} for manual review before provisioning.`
  };

  return {
    id: `${seed.id}-${channel}-${index}`,
    caseId: seed.id,
    channel,
    occurredAt,
    actor: channel === "approval_log" ? seed.manager : seed.requester,
    participants: [seed.requester, seed.manager, "IT Access Operations"],
    subject: subjectByChannel[channel],
    body: bodyByChannel[channel],
    metadata: {
      department: seed.department,
      system: seed.system,
      ticketId,
      region: seed.region,
      severity: seed.urgency
    }
  };
}

function tracesForSeed(seed: CaseSeed): RawWorkTrace[] {
  const channels: SourceChannel[] =
    seed.outcome === "approved"
      ? ["email", "ticket", "chat", "approval_log", "system_action"]
      : ["email", "ticket", "chat", "approval_log"];

  return channels.map((channel, index) => makeTrace(seed, channel, index + 1));
}

export const rawTraces: RawWorkTrace[] = seeds.flatMap(tracesForSeed);

export const approvalHistory: ApprovalHistoryRecord[] = seeds.map((seed) => ({
  id: `${seed.id}-approval`,
  caseId: seed.id,
  approver: seed.manager,
  role: seed.requestType === "privileged_access" ? "system_owner" : "manager",
  decision: seed.outcome === "rejected" ? "rejected" : "approved",
  requestedAt: seed.submittedAt,
  decidedAt: seed.approvedAt,
  comments: seed.exception
    ? `Approved with exception review required: ${seed.exception}.`
    : `Approved standard ${seed.system} access.`
}));

export const newIncomingTrace: RawWorkTrace = {
  id: "case-2001-email-1",
  caseId: "case-2001",
  channel: "email",
  occurredAt: "2026-05-15T09:08:00Z",
  actor: "Leah Morgan",
  participants: ["Leah Morgan", "Ari Patel", "IT Access Operations"],
  subject: "Need Salesforce access for enterprise renewal work",
  body: "Leah Morgan from Revenue Operations needs normal Salesforce access for renewal forecasting. Manager is Ari Patel. No privileged role requested.",
  metadata: {
    department: "Revenue Operations",
    system: "Salesforce",
    ticketId: "IT-2001",
    region: "NA",
    severity: "normal"
  }
};

export const demoFixtures: DemoFixtureSet = {
  rawTraces,
  policyRules,
  approvalHistory,
  newIncomingTrace
};

interface ProcurementCaseSeed {
  id: string;
  requester: string;
  department: string;
  manager: string;
  vendor: string;
  system: string;
  requestType: RequestType;
  urgency: Urgency;
  region: string;
  amountUsd: number;
  submittedAt: string;
  approvedAt: string;
  completedAt?: string;
  exception?: string;
  outcome: "approved" | "manual_review" | "rejected";
}

const procurementSeeds: ProcurementCaseSeed[] = [
  {
    id: "case-3001",
    requester: "Amara Okafor",
    department: "Marketing",
    manager: "Devon Lane",
    vendor: "BrightAds",
    system: "Coupa",
    requestType: "software_procurement",
    urgency: "normal",
    region: "NA",
    amountUsd: 18000,
    submittedAt: "2026-05-01T14:10:00Z",
    approvedAt: "2026-05-03T17:20:00Z",
    completedAt: "2026-05-03T18:05:00Z",
    outcome: "approved"
  },
  {
    id: "case-3002",
    requester: "Felix Grant",
    department: "Engineering",
    manager: "Samira Khan",
    vendor: "CloudForge",
    system: "Coupa",
    requestType: "software_procurement",
    urgency: "high",
    region: "EMEA",
    amountUsd: 42000,
    submittedAt: "2026-05-02T10:25:00Z",
    approvedAt: "2026-05-06T11:40:00Z",
    completedAt: "2026-05-06T13:15:00Z",
    exception: "security_questionnaire_pending",
    outcome: "manual_review"
  },
  {
    id: "case-3003",
    requester: "Nina Park",
    department: "Customer Success",
    manager: "Nora Ellis",
    vendor: "SurveyLoop",
    system: "Coupa",
    requestType: "software_procurement",
    urgency: "normal",
    region: "APAC",
    amountUsd: 9600,
    submittedAt: "2026-05-03T05:00:00Z",
    approvedAt: "2026-05-04T09:25:00Z",
    completedAt: "2026-05-04T11:10:00Z",
    outcome: "approved"
  },
  {
    id: "case-3004",
    requester: "Theo James",
    department: "Finance",
    manager: "Priya Shah",
    vendor: "LedgerWorks",
    system: "VendorRisk",
    requestType: "vendor_onboarding",
    urgency: "normal",
    region: "NA",
    amountUsd: 55000,
    submittedAt: "2026-05-04T16:30:00Z",
    approvedAt: "2026-05-08T20:45:00Z",
    exception: "new_vendor_risk_review",
    outcome: "manual_review"
  },
  {
    id: "case-3005",
    requester: "Sofia Alvarez",
    department: "People",
    manager: "Marin Ito",
    vendor: "LearnPath",
    system: "Coupa",
    requestType: "software_procurement",
    urgency: "low",
    region: "LATAM",
    amountUsd: 7200,
    submittedAt: "2026-05-05T12:45:00Z",
    approvedAt: "2026-05-07T13:05:00Z",
    completedAt: "2026-05-07T14:00:00Z",
    outcome: "approved"
  },
  {
    id: "case-3006",
    requester: "Ben Ito",
    department: "Sales",
    manager: "Ari Patel",
    vendor: "CallSense",
    system: "Coupa",
    requestType: "software_procurement",
    urgency: "high",
    region: "NA",
    amountUsd: 12500,
    submittedAt: "2026-05-06T09:15:00Z",
    approvedAt: "2026-05-09T15:15:00Z",
    completedAt: "2026-05-09T16:40:00Z",
    outcome: "approved"
  },
  {
    id: "case-3007",
    requester: "Lena Fischer",
    department: "Legal",
    manager: "Marin Ito",
    vendor: "ClausePilot",
    system: "VendorRisk",
    requestType: "vendor_onboarding",
    urgency: "normal",
    region: "EMEA",
    amountUsd: 28000,
    submittedAt: "2026-05-07T08:35:00Z",
    approvedAt: "2026-05-10T10:20:00Z",
    exception: "data_processing_addendum_required",
    outcome: "manual_review"
  },
  {
    id: "case-3008",
    requester: "Marco Bellini",
    department: "Finance",
    manager: "Priya Shah",
    vendor: "OfficeGrid",
    system: "NetSuite",
    requestType: "invoice_exception",
    urgency: "normal",
    region: "NA",
    amountUsd: 8400,
    submittedAt: "2026-05-08T13:05:00Z",
    approvedAt: "2026-05-12T16:30:00Z",
    exception: "missing_purchase_order",
    outcome: "manual_review"
  },
  {
    id: "case-3009",
    requester: "June Howard",
    department: "Revenue Operations",
    manager: "Ari Patel",
    vendor: "DataDesk",
    system: "Coupa",
    requestType: "software_procurement",
    urgency: "normal",
    region: "NA",
    amountUsd: 15300,
    submittedAt: "2026-05-09T15:25:00Z",
    approvedAt: "2026-05-11T18:05:00Z",
    completedAt: "2026-05-11T19:00:00Z",
    outcome: "approved"
  },
  {
    id: "case-3010",
    requester: "Omar Haddad",
    department: "Customer Success",
    manager: "Nora Ellis",
    vendor: "SuccessMap",
    system: "Coupa",
    requestType: "software_procurement",
    urgency: "low",
    region: "EMEA",
    amountUsd: 6400,
    submittedAt: "2026-05-10T09:20:00Z",
    approvedAt: "2026-05-11T12:10:00Z",
    completedAt: "2026-05-11T13:40:00Z",
    outcome: "approved"
  }
];

export const procurementPolicyRules: PolicyRule[] = [
  {
    id: "policy-software-procurement",
    label: "Software procurement intake",
    description: "Software purchases require manager approval, budget owner confirmation, and vendor catalog matching.",
    appliesTo: ["software_procurement"],
    riskLevel: "low",
    requiresHumanReview: false,
    escalationRole: "procurement"
  },
  {
    id: "policy-vendor-onboarding",
    label: "Vendor onboarding risk review",
    description: "New vendors require procurement, legal, and security risk review before onboarding.",
    appliesTo: ["vendor_onboarding"],
    riskLevel: "medium",
    requiresHumanReview: true,
    escalationRole: "legal"
  },
  {
    id: "policy-invoice-exception",
    label: "Invoice exception handling",
    description: "Invoices missing a purchase order require finance approval and an audit note.",
    appliesTo: ["invoice_exception"],
    riskLevel: "medium",
    requiresHumanReview: true,
    escalationRole: "finance"
  }
];

function makeProcurementTrace(seed: ProcurementCaseSeed, channel: SourceChannel, index: number): RawWorkTrace {
  const ticketId = `PR-${seed.id.replace("case-", "")}`;
  const occurredAt =
    channel === "email"
      ? seed.submittedAt
      : channel === "approval_log"
        ? seed.approvedAt
        : channel === "system_action" && seed.completedAt
          ? seed.completedAt
          : seed.submittedAt;

  const subjectByChannel: Record<SourceChannel, string> = {
    email: `Procurement intake for ${seed.vendor}`,
    ticket: `${ticketId}: ${seed.department} purchase request for ${seed.vendor}`,
    chat: `Follow-up on ${seed.vendor} procurement request`,
    approval_log: `${seed.manager} approval for ${seed.vendor}`,
    system_action: `${seed.system} procurement update`
  };

  const bodyByChannel: Record<SourceChannel, string> = {
    email: `${seed.requester} from ${seed.department} requested ${seed.vendor} via ${seed.system} with ${seed.urgency} urgency in ${seed.region}. Estimated amount is ${seed.amountUsd} USD.`,
    ticket: `Procurement request ${ticketId} is categorized as ${seed.requestType}. ${seed.exception ? `Exception noted: ${seed.exception}.` : "No exception noted."}`,
    chat: `${seed.requester} asked procurement for status because manager approval and policy review are gating steps.`,
    approval_log: `${seed.manager} approved request ${ticketId} for ${seed.requester}.`,
    system_action:
      seed.outcome === "approved"
        ? `Procurement created a mock purchase workflow in ${seed.system} and wrote audit log for ${ticketId}.`
        : `Procurement routed ${ticketId} for manual review before vendor or purchase order action.`
  };

  return {
    id: `${seed.id}-${channel}-${index}`,
    caseId: seed.id,
    channel,
    occurredAt,
    actor: channel === "approval_log" ? seed.manager : seed.requester,
    participants: [seed.requester, seed.manager, "Procurement Operations"],
    subject: subjectByChannel[channel],
    body: bodyByChannel[channel],
    metadata: {
      department: seed.department,
      system: seed.system,
      ticketId,
      region: seed.region,
      severity: seed.urgency
    }
  };
}

function procurementTracesForSeed(seed: ProcurementCaseSeed): RawWorkTrace[] {
  const channels: SourceChannel[] =
    seed.outcome === "approved"
      ? ["email", "ticket", "chat", "approval_log", "system_action"]
      : ["email", "ticket", "chat", "approval_log"];

  return channels.map((channel, index) => makeProcurementTrace(seed, channel, index + 1));
}

export const procurementRawTraces: RawWorkTrace[] = procurementSeeds.flatMap(procurementTracesForSeed);

export const procurementApprovalHistory: ApprovalHistoryRecord[] = procurementSeeds.map((seed) => ({
  id: `${seed.id}-approval`,
  caseId: seed.id,
  approver: seed.manager,
  role:
    seed.requestType === "vendor_onboarding"
      ? "legal"
      : seed.requestType === "invoice_exception"
        ? "finance"
        : "manager",
  decision: seed.outcome === "rejected" ? "rejected" : "approved",
  requestedAt: seed.submittedAt,
  decidedAt: seed.approvedAt,
  comments: seed.exception
    ? `Approved with procurement exception review required: ${seed.exception}.`
    : `Approved ${seed.vendor} procurement intake.`
}));

export const procurementNewIncomingTrace: RawWorkTrace = {
  id: "case-4001-email-1",
  caseId: "case-4001",
  channel: "email",
  occurredAt: "2026-05-15T12:15:00Z",
  actor: "Mina Torres",
  participants: ["Mina Torres", "Devon Lane", "Procurement Operations"],
  subject: "Procurement request for renewal analytics tool",
  body: "Mina Torres from Marketing needs normal DataDesk procurement intake for renewal analytics. Manager is Devon Lane. No new vendor or invoice exception requested.",
  metadata: {
    department: "Marketing",
    system: "Coupa",
    ticketId: "PR-4001",
    region: "NA",
    severity: "normal"
  }
};

export const procurementDemoFixtures: DemoFixtureSet = {
  rawTraces: procurementRawTraces,
  policyRules: procurementPolicyRules,
  approvalHistory: procurementApprovalHistory,
  newIncomingTrace: procurementNewIncomingTrace
};

export const demoScenarios: DemoScenario[] = [
  {
    id: "it-access",
    label: "IT access requests",
    workflowName: "Access request operations",
    description: "Employees request application access through email, tickets, chat, approvals, and system actions.",
    operatorGoal: "Show how the system discovers manager approval delay and proposes governed access automation.",
    graphTitle: "IT access request flow",
    topSystemLabel: "Top application",
    syntheticDataNotice: "All access request names, tickets, approvals, and systems are synthetic demo fixtures.",
    requiredOrgData: [
      "workflow metadata",
      "task events",
      "timestamps",
      "statuses",
      "owners and roles",
      "approval records",
      "system identifiers"
    ],
    excludedOrgData: [
      "passwords",
      "raw secrets",
      "private message bodies",
      "production write access",
      "unrestricted admin access"
    ],
    fixtures: demoFixtures
  },
  {
    id: "procurement-intake",
    label: "Procurement intake",
    workflowName: "Procurement operations",
    description: "Teams request software purchases and vendor onboarding through intake tickets, approval logs, and procurement-system updates.",
    operatorGoal: "Show how repeated low-risk software procurement can be accelerated while vendor and invoice exceptions stay human-reviewed.",
    graphTitle: "Procurement intake flow",
    topSystemLabel: "Top procurement system",
    syntheticDataNotice: "All procurement requesters, vendors, amounts, tickets, and approvals are synthetic demo fixtures.",
    requiredOrgData: [
      "workflow metadata",
      "purchase request events",
      "timestamps",
      "statuses",
      "request owners and approver roles",
      "approval records",
      "vendor and procurement system identifiers"
    ],
    excludedOrgData: [
      "bank account details",
      "raw contract bodies",
      "vendor secrets",
      "production purchasing write access",
      "unrestricted procurement admin access"
    ],
    fixtures: procurementDemoFixtures
  }
];
