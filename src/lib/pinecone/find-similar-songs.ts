import { averageEmbeddings } from "../ingestion/compute-playlist-embedding";
import { fetchSongEmbeddings } from "./fetch-songs-embeddings";
import { songsIndex } from "./pinecone";

export interface SimilarSong {
  songKey: string;
  artist: string;
  track: string;
  album: string;
  trackTags: string[];
  artistTags: string[];
  similarArtists: string[];
  score: number; // cosine similarity 0–1
}

export interface SimilaritySearchResult {
  recommendations: SimilarSong[];
  playlistCoverage: {
    embedded: number; // how many playlist songs had vectors
    total: number; // how many were requested
    missing: string[]; // song keys that had no vector
  };
}

interface SimilarSongParams {
  playlistSongKeys: string[];
  limit?: number;
  minScore?: number;
}

export async function findSimilarSongs({
  playlistSongKeys,
  limit = 20,
  minScore = 0.6,
}: SimilarSongParams): Promise<SimilaritySearchResult> {
  const { found, missing } = await fetchSongEmbeddings(playlistSongKeys);

  if (found.length === 0) {
    throw new Error(
      "None of the playlist songs have embeddings yet. " +
        "Run upsertSong() for these tracks first.",
    );
  }

  // --- Build playlist vector ---
  const playlistVector = averageEmbeddings(found.map((f) => f.embedding));

  // fetch mor than needed, so there are rooms to exclude playlist songs
  const topK = limit + playlistSongKeys.length;

  // --- Query pinecone ---
  const queryRes = await songsIndex.query({
    topK,
    vector: playlistVector,
    includeMetadata: true,
  });

  const playlistSet = new Set(playlistSongKeys);

  // --- Filter results
  const recommendations: SimilarSong[] = [];

  for (const match of queryRes.matches) {
    if (recommendations.length >= limit) break;

    // Exclude songs already in the playlist
    if (playlistSet.has(match.id)) continue;

    // Exclude low-confidence in matches
    if (match.score ?? 0 < minScore) continue;

    const meta = match.metadata ?? {};

    recommendations.push({
      songKey: match.id,
      artist: String(meta.artist ?? ""),
      track: String(meta.track ?? ""),
      album: String(meta.album ?? ""),
      trackTags: toStringArray(meta.trackTags),
      artistTags: toStringArray(meta.artistTags),
      similarArtists: toStringArray(meta.similarArtists),
      score: match.score ?? 0,
    });
  }

  return {
    recommendations,
    playlistCoverage: {
      embedded: found.length,
      total: playlistSongKeys.length,
      missing,
    },
  };
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  return [];
}
