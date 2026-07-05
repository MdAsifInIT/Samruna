import { createAiProvider, DEFAULT_OPENAI_MODEL, type AiProvider } from "../src/ai/providers";

const DEFAULT_OPENAI_TIMEOUT_MS = 20_000;

export function createServerAiProvider(env: NodeJS.ProcessEnv = process.env): AiProvider {
  return createAiProvider({
    openAiApiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL,
    timeoutMs: readPositiveInteger(env.OPENAI_TIMEOUT_MS) ?? DEFAULT_OPENAI_TIMEOUT_MS
  });
}

function readPositiveInteger(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}
