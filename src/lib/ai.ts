import { env } from "~/env";
import { createOpenAI } from "@ai-sdk/openai";

const openRouterApiEndpoints = ["chat/completions", "embeddings"] as const;
type TOpenRouterApiEndpoints = (typeof openRouterApiEndpoints)[number];

type OpenRouterModels =
  | "openai/text-embedding-3-large"
  | "moonshotai/kimi-k2-0905"
  | "x-ai/grok-4.1-fast"
  | "google/gemini-3-flash-preview"
  | "openai/gpt-4o-mini"
  | "openai/gpt-5-mini"
  | "openai/gpt-4.1-mini"
  | "anthropic/claude-3-haiku";

const openRouterClient = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: env.OPENROUTER,
});

export const openRouterApi = {
  getModel: (modelId: OpenRouterModels) => openRouterClient(modelId),
};
