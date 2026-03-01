import { db } from "~/server/db";
import { songs } from "~/server/db/schema";
import { averageEmbeddings } from "../ingestion/compute-playlist-embedding";
import { fetchSongEmbeddings } from "./fetch-songs-embeddings";
import { songsIndex } from "./pinecone";
import { inArray } from "drizzle-orm";
import type { SanatisedMusicData } from "../ingestion/group-lastfm-data";

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

  // --- Build playlist tag profile from DB ---
  const playlistTagSet = await buildPlaylistTagSet(playlistSongKeys);

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
    if (!match.id || playlistSet.has(match.id)) continue;

    const vectorScore = match.score ?? 0;
    if (vectorScore < minScore) continue;

    const meta = match.metadata ?? {};

    const candidateTrackTags = toStringArray(meta.trackTags);
    const candidateArtistTags = toStringArray(meta.artistTags);

    const tagOverlapCount =
      candidateTrackTags.filter((t) => playlistTagSet.has(t.toLowerCase()))
        .length +
      candidateArtistTags.filter((t) => playlistTagSet.has(t.toLowerCase()))
        .length;

    const normalizedTagOverlap =
      tagOverlapCount /
      Math.max(candidateTrackTags.length + candidateArtistTags.length, 1);

    const finalScore = 0.8 * vectorScore + 0.2 * normalizedTagOverlap;

    recommendations.push({
      songKey: match.id,
      artist: String(meta.artist ?? ""),
      track: String(meta.track ?? ""),
      album: String(meta.album ?? ""),
      trackTags: candidateTrackTags,
      artistTags: candidateArtistTags,
      similarArtists: toStringArray(meta.similarArtists),
      score: finalScore,
    });
  }

  recommendations.sort((a, b) => b.score - a.score);

  const finalRecs = recommendations.slice(0, limit);

  return {
    recommendations: finalRecs,
    playlistCoverage: {
      embedded: found.length,
      total: playlistSongKeys.length,
      missing,
    },
  };
}

async function buildPlaylistTagSet(songKeys: string[]): Promise<Set<string>> {
  const rows = await db
    .select({ metadata: songs.metadata })
    .from(songs)
    .where(inArray(songs.songKey, songKeys));

  const tagSet = new Set<string>();

  for (const row of rows) {
    const meta = row.metadata as SanatisedMusicData;

    const trackTags = toStringArray(meta?.trackTags);
    const artistTags = toStringArray(meta?.artistTags);

    for (const tag of [...trackTags, ...artistTags]) {
      tagSet.add(tag.toLowerCase());
    }
  }
  return tagSet;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  return [];
}
