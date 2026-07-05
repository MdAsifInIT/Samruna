import type {
  AutomationOpportunity,
  AutomationProposal,
  BottleneckInsight,
  PolicyRule,
  WorkGraph,
  WorkPattern
} from "../domain/types";
import { generateAutomationProposal } from "../domain/planner";
import type { AiProviderMode } from "../domain/persistence";

export const DEFAULT_OPENAI_MODEL = "gpt-5.5";
const DEFAULT_OPENAI_TIMEOUT_MS = 20_000;

export interface ProposalContext {
  pattern: WorkPattern;
  graph: WorkGraph;
  policyRules: PolicyRule[];
  bottleneck: BottleneckInsight;
  opportunity: AutomationOpportunity;
}

export interface AiProviderStatus {
  mode: AiProviderMode;
  label: string;
  available: boolean;
  model?: string;
}

export interface AiProvider {
  status: AiProviderStatus;
  generateProposal(context: ProposalContext): Promise<AutomationProposal>;
}

export class MockAiProvider implements AiProvider {
  status: AiProviderStatus = {
    mode: "mock",
    label: "Historical validation engine",
    available: true,
    model: "validation-planner"
  };

  async generateProposal(context: ProposalContext): Promise<AutomationProposal> {
    return generateAutomationProposal(context);
  }
}

export class OpenAiResponsesProvider implements AiProvider {
  readonly status: AiProviderStatus;

  constructor(
    private readonly apiKey: string,
    private readonly options: {
      model?: string;
      fetcher?: typeof fetch;
      timeoutMs?: number;
    } = {}
  ) {
    this.status = {
      mode: "openai",
      label: "OpenAI Responses API",
      available: true,
      model: this.options.model ?? DEFAULT_OPENAI_MODEL
    };
  }

  async generateProposal(context: ProposalContext): Promise<AutomationProposal> {
    const fetcher = this.options.fetcher ?? fetch;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs ?? DEFAULT_OPENAI_TIMEOUT_MS);

    const response = await fetcher("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.options.model ?? DEFAULT_OPENAI_MODEL,
        store: false,
        input: [
          {
            role: "system",
            content:
              "You generate governed enterprise automation proposals. Return only structured JSON matching the schema."
          },
          {
            role: "user",
            content: JSON.stringify({
              pattern: context.pattern,
              graphMetrics: context.graph.metrics,
              policyRules: context.policyRules,
              bottleneck: context.bottleneck,
              opportunity: context.opportunity
            })
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "automation_proposal",
            strict: true,
            schema: automationProposalSchema
          }
        }
      }),
      signal: controller.signal
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      throw new AiProviderError(`openai_http_${response.status}`, `OpenAI proposal request failed with ${response.status}`);
    }

    const payload = (await response.json()) as OpenAiResponsePayload;
    let parsed: unknown;

    try {
      parsed = parseOutputJson(payload);
    } catch (error) {
      throw new AiProviderError("openai_parse_failed", error instanceof Error ? error.message : "OpenAI response parse failed");
    }

    if (!isAutomationProposal(parsed)) {
      throw new AiProviderError("openai_contract_mismatch", "OpenAI proposal response did not match AutomationProposal contract");
    }

    return parsed;
  }
}

export class AiProviderError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}

export function createAiProvider(
  config: { openAiApiKey?: string; model?: string; fetcher?: typeof fetch; timeoutMs?: number } = {}
): AiProvider {
  if (config.openAiApiKey) {
    return new OpenAiResponsesProvider(config.openAiApiKey, {
      model: config.model,
      fetcher: config.fetcher,
      timeoutMs: config.timeoutMs
    });
  }

  return new MockAiProvider();
}

const automationProposalSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "patternId",
    "trigger",
    "requiredData",
    "eligibilityRules",
    "policyChecks",
    "actions",
    "escalations",
    "confidence",
    "riskLevel",
    "expectedValue",
    "auditRationale",
    "version"
  ],
  properties: {
    id: { type: "string" },
    patternId: { type: "string" },
    trigger: { type: "string" },
    requiredData: { type: "array", items: { type: "string" } },
    eligibilityRules: { type: "array", items: { type: "string" } },
    policyChecks: { type: "array", items: { type: "string" } },
    actions: { type: "array", items: { type: "string" } },
    escalations: { type: "array", items: { type: "string" } },
    confidence: { type: "number" },
    riskLevel: { type: "string", enum: ["low", "medium", "high"] },
    expectedValue: { type: "string" },
    auditRationale: { type: "string" },
    version: { type: "number" }
  }
};

interface OpenAiResponsePayload {
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
}

function parseOutputJson(payload: OpenAiResponsePayload): unknown {
  const outputText = payload.output
    ?.flatMap((item) => item.content ?? [])
    .find((content) => content.type === "output_text" && content.text)?.text;

  if (!outputText) {
    throw new Error("OpenAI response did not include output_text");
  }

  return JSON.parse(outputText);
}

function isAutomationProposal(value: unknown): value is AutomationProposal {
  if (!value || typeof value !== "object") {
    return false;
  }

  const proposal = value as Partial<AutomationProposal>;

  return (
    typeof proposal.id === "string" &&
    typeof proposal.patternId === "string" &&
    typeof proposal.trigger === "string" &&
    Array.isArray(proposal.requiredData) &&
    Array.isArray(proposal.eligibilityRules) &&
    Array.isArray(proposal.policyChecks) &&
    Array.isArray(proposal.actions) &&
    Array.isArray(proposal.escalations) &&
    typeof proposal.confidence === "number" &&
    (proposal.riskLevel === "low" || proposal.riskLevel === "medium" || proposal.riskLevel === "high") &&
    typeof proposal.expectedValue === "string" &&
    typeof proposal.auditRationale === "string" &&
    typeof proposal.version === "number"
  );
}
