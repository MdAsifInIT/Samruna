import { describe, expect, it } from "vitest";
import { AiProviderError, createAiProvider, MockAiProvider, OpenAiResponsesProvider } from "./providers";
import { loadDemoFixtures } from "../domain/fixtures";
import { buildWorkGraph } from "../domain/graph";
import { ingestWorkTraces } from "../domain/ingestion";
import { detectWorkPatterns } from "../domain/patterns";
import { generateAutomationProposal } from "../domain/planner";

function makeContext() {
  const fixtures = loadDemoFixtures();
  const ingestion = ingestWorkTraces(fixtures.rawTraces, fixtures.approvalHistory);
  const detection = detectWorkPatterns(ingestion.items);
  const pattern = detection.patterns[0];

  if (!pattern) {
    throw new Error("Expected a top pattern");
  }

  const graph = buildWorkGraph(ingestion.items, "it-access", pattern.id);
  const bottleneck = detection.bottlenecks.find((item) => item.patternId === pattern.id);
  const opportunity = detection.opportunities.find((item) => item.patternId === pattern.id);

  if (!bottleneck || !opportunity) {
    throw new Error("Expected bottleneck and opportunity");
  }

  return {
    context: {
      pattern,
      graph,
      policyRules: fixtures.policyRules,
      bottleneck,
      opportunity
    }
  };
}

describe("AI providers", () => {
  it("uses the deterministic mock provider by default", async () => {
    const { context } = makeContext();
    const provider = createAiProvider();
    const proposal = await provider.generateProposal(context);

    expect(provider).toBeInstanceOf(MockAiProvider);
    expect(provider.status.mode).toBe("mock");
    expect(proposal.patternId).toBe(context.pattern.id);
  });

  it("parses structured proposal output from the OpenAI provider", async () => {
    const { context } = makeContext();
    const expectedProposal = generateAutomationProposal(context);
    let requestBody: Record<string, unknown> | undefined;
    const fetcher: typeof fetch = async (_input, init) => {
      requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;

      return new Response(
        JSON.stringify({
          output: [
            {
              type: "message",
              content: [
                {
                  type: "output_text",
                  text: JSON.stringify(expectedProposal)
                }
              ]
            }
          ]
        }),
        { status: 200 }
      );
    };
    const provider = new OpenAiResponsesProvider("test-key", { fetcher, model: "gpt-5.5" });
    const proposal = await provider.generateProposal(context);

    expect(provider.status.mode).toBe("openai");
    expect(provider.status.model).toBe("gpt-5.5");
    expect(requestBody).toMatchObject({
      model: "gpt-5.5",
      store: false
    });
    expect(proposal).toEqual(expectedProposal);
  });

  it("rejects invalid structured output from the OpenAI provider", async () => {
    const { context } = makeContext();
    const fetcher: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          output: [
            {
              type: "message",
              content: [
                {
                  type: "output_text",
                  text: JSON.stringify({ id: "missing-required-fields" })
                }
              ]
            }
          ]
        }),
        { status: 200 }
      );
    const provider = new OpenAiResponsesProvider("test-key", { fetcher, model: "gpt-5.5" });

    await expect(provider.generateProposal(context)).rejects.toMatchObject({
      code: "openai_contract_mismatch"
    } satisfies Partial<AiProviderError>);
  });
});
