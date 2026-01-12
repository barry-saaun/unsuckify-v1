import { env } from "~/env";
import { createOpenAI } from "@ai-sdk/openai";

type OpenRouterModels =
  | "moonshotai/kimi-k2-0905"
  | "x-ai/grok-4.1-fast"
  | "google/gemini-3-flash-preview";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: env.OPENROUTER,
});

export const orModel = (modelId: OpenRouterModels) =>
  openrouter(modelId as any);
