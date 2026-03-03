import { eq, notInArray } from "drizzle-orm";
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
import { type EmbedJobResult } from "../music/types";

export interface EmbedJobParams {
  // Spotify-derived identity used for consistent keying.
  // If omitted, we fall back to Last.fm track info values.
  identityArtist?: string;
  identityTrack?: string;
  trackInfo: LastFmGetTrackInfoResponse;
  artistTopTags: LastFmArtistTopTagsResponse;
  artistSimilar: LastFmArtistSimilarResponse;
}

async function embedAndIndexSong(
  songKey: string,
  metadata: ReturnType<typeof groupLastFmData>,
  identity?: { artist: string; track: string },
) {
  const embeddingMetadata = identity
    ? { ...metadata, artist: identity.artist, track: identity.track }
    : metadata;

  const embeddingText = buildEmbeddingText(embeddingMetadata);
  const { embedding, usage } = await generateEmbedding(embeddingText);

  const { track, artist, album, trackTags, artistTags, similarArtists } =
    embeddingMetadata;

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
      metadata: embeddingMetadata,
      updatedAt: new Date(),
    })
    .where(eq(songs.songKey, songKey));

  return { usage };
}

export async function upsertSong(
  userId: string,
  params: EmbedJobParams,
): Promise<EmbedJobResult> {
  const metadata = groupLastFmData(params);

  const identityArtist = params.identityArtist ?? metadata.artist;
  const identityTrack = params.identityTrack ?? metadata.track;

  const songKey = buildSongKey(identityArtist, identityTrack);

  // --- Mark as pending in Postgres (or insert if new) ---
  const { error: pendingError } = await tryCatch(
    db
      .insert(songs)
      .values({
        songKey,
        artist: identityArtist,
        track: identityTrack,
        album: metadata.album,
        embeddingStatus: "pending",
        metadata: { ...metadata, artist: identityArtist, track: identityTrack },
      })
      .onConflictDoUpdate({
        target: songs.songKey,
        set: {
          embeddingStatus: "pending",
          updatedAt: new Date(),
        },
        setWhere: notInArray(songs.embeddingStatus, ["ready", "no_metadata"]),
      }),
  );

  if (pendingError) throw pendingError;

  // --- Embed and index ---
  const { data: embedResult, error: embedError } = await tryCatch(
    embedAndIndexSong(songKey, metadata, {
      artist: identityArtist,
      track: identityTrack,
    }),
  );

  // Mark as failed
  if (embedError) {
    await db
      .update(songs)
      .set({ embeddingStatus: "failed", updatedAt: new Date() })
      .where(eq(songs.songKey, songKey));
    throw embedError;
  }

  return { songKey, outcome: "embedded", userId, usage: embedResult?.usage };
}
