import { embed, embedMany } from "ai";
import { openRouterApi } from "../openrouter";

const EMBEDDING_MODEL = openRouterApi.getEmbeddingModel(
  "openai/text-embedding-3-small",
);

export interface VectorEmbeddingResult {
  embedding: number[];
  usage: { tokens: number };
}

export async function generateEmbedding(
  text: string,
): Promise<VectorEmbeddingResult> {
  const { embedding, usage } = await embed({
    model: EMBEDDING_MODEL,
    value: text,
  });

  const usageTokens = usage.tokens;

  return { embedding, usage: { tokens: usageTokens } };
}

/*
 * Generate multiple embeddings for multiple texts in a single API call.
 * More efficient than calling `generateEmbedding` in loops
 * */
export async function generateEmbeddings(
  texts: string[],
): Promise<VectorEmbeddingResult[]> {
  const { embeddings, usage } = await embedMany({
    model: EMBEDDING_MODEL,
    values: texts,
  });

  const tokensPerItem = Math.ceil(usage.tokens / embeddings.length);

  return embeddings.map((embedding) => ({
    embedding,
    usage: { tokens: tokensPerItem },
  }));
}
