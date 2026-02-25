import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { groupLastFmData } from "../ingestion/group-lastfm-data";
import { buildSongKey } from "../ingestion/sanitise";
import type {
  LastFmArtistSimilarResponse,
  LastFmArtistTopTagsResponse,
  LastFmGetTrackInfoResponse,
} from "../music/types";
import { songs } from "~/server/db/schema";
import { tryCatch } from "../utils/try-catch";
import { buildEmbeddingText } from "../ingestion/build-embedding-text";
import { generateEmbedding } from "../ingestion/generate-embedding";
import { songsIndex } from "./pinecone";
import { type UpsertSongResult } from "../music/types";

export interface UpsertSongParams {
  trackInfo: LastFmGetTrackInfoResponse;
  artistTopTags: LastFmArtistTopTagsResponse;
  artistSimilar: LastFmArtistSimilarResponse;
}

async function embedAndIndexSong(
  songKey: string,
  metadata: ReturnType<typeof groupLastFmData>,
) {
  const embeddingText = buildEmbeddingText(metadata);
  const { embedding, usage } = await generateEmbedding(embeddingText);

  const { track, artist, album, trackTags, artistTags, similarArtists } =
    metadata;

  await songsIndex.upsert({
    records: [
      {
        id: songKey,
        values: embedding,
        metadata: {
          track,
          artist,
          album,
          trackTags,
          artistTags,
          similarArtists,
        },
      },
    ],
  });

  await db
    .update(songs)
    .set({
      embeddingStatus: "ready",
      embeddingText,
      metadata,
      updatedAt: new Date(),
    })
    .where(eq(songs.songKey, songKey));

  return { usage };
}

export async function upsertSong(
  params: UpsertSongParams,
): Promise<UpsertSongResult> {
  const metadata = groupLastFmData(params);
  const songKey = buildSongKey(metadata.artist, metadata.track);

  // --- Check if already embedded ---
  const { data: existing, error: fetchError } = await tryCatch(
    db
      .select({ embeddingStatus: songs.embeddingStatus })
      .from(songs)
      .where(eq(songs.songKey, songKey))
      .limit(1),
  );

  if (fetchError) throw fetchError;

  if (existing[0]?.embeddingStatus === "ready") {
    return { songKey, status: "skipped" };
  }

  // --- Mark as pending in Postgres (or insert if new) ---
  const { error: pendingError } = await tryCatch(
    db
      .insert(songs)
      .values({
        songKey,
        artist: metadata.artist,
        track: metadata.track,
        album: metadata.album,
        embeddingStatus: "pending",
        metadata,
      })
      .onConflictDoUpdate({
        target: songs.songKey,
        set: {
          embeddingStatus: "pending",
          updatedAt: new Date(),
        },
      }),
  );

  if (pendingError) throw pendingError;

  // --- Embed and index ---
  const { data: embedResult, error: embedError } = await tryCatch(
    embedAndIndexSong(songKey, metadata),
  );

  // Mark as failed
  if (embedError) {
    await db
      .update(songs)
      .set({ embeddingStatus: "failed", updatedAt: new Date() })
      .where(eq(songs.songKey, songKey));
    throw embedError;
  }

  return { songKey, status: "updated", usage: embedResult?.usage };
}
