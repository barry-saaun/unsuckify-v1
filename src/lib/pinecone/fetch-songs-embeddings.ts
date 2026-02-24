import { songsIndex } from "./pinecone";

export interface FetchedEmbedding {
  songKey: string;
  embedding: number[];
}
export interface FetchedEmbeddingResult {
  found: FetchedEmbedding[];
  missing: string[]; // song keys that are not yet in pinecone
}

export async function fetchSongEmbeddings(
  songKeys: string[],
): Promise<FetchedEmbeddingResult> {
  if (songKeys.length === 0) {
    return { found: [], missing: [] };
  }
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
