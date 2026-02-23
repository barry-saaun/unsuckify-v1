import { env } from "~/env";
import { createOpenAI } from "@ai-sdk/openai";

// const openRouterApiEndpoints = ["chat/completions", "embeddings"] as const;
// type TOpenRouterApiEndpoints = (typeof openRouterApiEndpoints)[number];

type OpenRouterChatModels =
  | "moonshotai/kimi-k2-0905"
  | "x-ai/grok-4.1-fast"
  | "google/gemini-3-flash-preview"
  | "openai/gpt-4o-mini"
  | "openai/gpt-5-mini"
  | "openai/gpt-4.1-mini"
  | "anthropic/claude-3-haiku";

type OpenRouterEmbeddingModels = "openai/text-embedding-3-small";

const openRouterClient = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: env.OPENROUTER,
});

export const openRouterApi = {
  getChatModel: (modelId: OpenRouterChatModels) => openRouterClient(modelId),
  getEmbeddingModel: (modelId: OpenRouterEmbeddingModels) =>
    openRouterClient.embedding(modelId),
};
