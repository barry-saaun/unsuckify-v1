import { songsIndex } from "./pinecone";

export interface FetchedEmbedding {
  songKey: string;
  embedding: number[];
}
export interface FetchedEmbeddingResult {
  found: FetchedEmbedding[];
  missing: string[]; // song keys that are not yet in pinecone
}

/**
 * Batches song key fetches to avoid Pinecone's 414 Request-URI Too Large error.
 * The Pinecone API uses GET requests for fetch operations, which have URL length limits.
 * This implementation splits requests into batches of 100 items.
 */
const BATCH_SIZE = 100;

export async function fetchSongEmbeddings(
  songKeys: string[],
): Promise<FetchedEmbeddingResult> {
  if (songKeys.length === 0) {
    return { found: [], missing: [] };
  }

  // Split into batches to avoid URI length limits
  const batches: string[][] = [];
  for (let i = 0; i < songKeys.length; i += BATCH_SIZE) {
    batches.push(songKeys.slice(i, i + BATCH_SIZE));
  }

  const allResults = await Promise.all(
    batches.map((batch) => fetchBatch(batch)),
  );

  // Merge all batch results
  const found: FetchedEmbedding[] = [];
  const missing: string[] = [];

  for (const result of allResults) {
    found.push(...result.found);
    missing.push(...result.missing);
  }

  return { found, missing };
}

/**
 * Fetches a single batch of song embeddings from Pinecone.
 */
async function fetchBatch(songKeys: string[]): Promise<FetchedEmbeddingResult> {
  const res = await songsIndex.fetch({ ids: songKeys });

  const found: FetchedEmbedding[] = [];
  const missing: string[] = [];

  for (const songKey of songKeys) {
    const record = res.records[songKey];

    if (record?.values && record.values.length > 0) {
      found.push({ songKey, embedding: record.values });
    } else {
      missing.push(songKey);
    }
  }

  return { found, missing };
}
