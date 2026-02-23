import pLimit from "p-limit";
import type { UpsertSongParams } from "./upsert-song";
import { groupLastFmData } from "../ingestion/group-lastfm-data";
import { buildSongKey } from "../ingestion/sanitise";
import { buildEmbeddingText } from "../ingestion/build-embedding-text";
import { db } from "~/server/db";
import { eq, inArray } from "drizzle-orm";
import { songs } from "~/server/db/schema";
import { tryCatch } from "../utils/try-catch";
import { generateEmbeddings } from "../ingestion/generate-embedding";
import { songsIndex } from "./pinecone";

interface SongRawData extends UpsertSongParams {}

interface BatchUpsertResult {
  upserted: string[];
  skipped: string[];
  failed: Array<{ songKey: string; error: string }>;
  usage: { totalTokens: number };
}

interface PreparedSong {
  metadata: ReturnType<typeof groupLastFmData>;
  songKey: string;
  embeddingText: string;
}

const PINECONE_BATCH_SIZE = 100;

// --- Step 1: Prepare and filter --- //
function prepareSongs(rawSongs: SongRawData[]): PreparedSong[] {
  return rawSongs.map((s) => {
    const metadata = groupLastFmData(s);
    return {
      metadata,
      songKey: buildSongKey(metadata.artist, metadata.track),
      embeddingText: buildEmbeddingText(metadata),
    };
  });
}

async function filterReadySongs(
  prepared: PreparedSong[],
): Promise<{ toProcess: PreparedSong[]; skipped: string[] }> {
  const songKeys = prepared.map((s) => s.songKey);

  const { data: rows, error } = await tryCatch(
    db
      .select({
        songKey: songs.songKey,
        embeddingStatus: songs.embeddingStatus,
      })
      .from(songs)
      .where(inArray(songs.songKey, songKeys)),
  );

  if (error) throw error;

  const readySet = new Set(
    rows.filter((r) => r.embeddingStatus === "ready").map((r) => r.songKey),
  );

  return {
    toProcess: prepared.filter((s) => !readySet.has(s.songKey)),
    skipped: prepared
      .filter((s) => readySet.has(s.songKey))
      .map((s) => s.songKey),
  };
}

// --- Step 2: Mark as pending --- //
async function markAsPending(toProcess: PreparedSong[]): Promise<void> {
  const { error } = await tryCatch(
    db
      .insert(songs)
      .values(
        toProcess.map((s) => ({
          songKey: s.songKey,
          artist: s.metadata.artist,
          track: s.metadata.track,
          album: s.metadata.album,
          embeddingStatus: "pending" as const,
          metadata: s.metadata,
        })),
      )
      .onConflictDoUpdate({
        target: songs.songKey,
        set: { embeddingStatus: "pending", updatedAt: new Date() },
      }),
  );

  if (error) throw error;
}

// --- Step 3: Generate embeddings --- //
async function getEmbeddings(
  toProcess: PreparedSong[],
): Promise<{ embeddings: number[][]; totalTokens: number }> {
  const { data, error } = await tryCatch(
    generateEmbeddings(toProcess.map((s) => s.embeddingText)),
  );

  if (error) {
    await db
      .update(songs)
      .set({ embeddingStatus: "failed", updatedAt: new Date() })
      .where(
        inArray(
          songs.songKey,
          toProcess.map((s) => s.songKey),
        ),
      );

    throw error;
  }

  return {
    embeddings: data.map((r) => r.embedding),
    totalTokens: data.reduce((sum, r) => sum + r.usage.tokens, 0),
  };
}

// --- Step 4: Upsert to Pinecone --- //
async function upsertToPinecone(
  toProcess: PreparedSong[],
  embeddings: number[][],
): Promise<void> {
  const records = toProcess.map((s, i) => ({
    id: s.songKey,
    values: embeddings[i]!,
    metadata: {
      artist: s.metadata.artist,
      track: s.metadata.track,
      album: s.metadata.album,
      trackTags: s.metadata.trackTags,
      artistTags: s.metadata.artistTags,
      similarArtists: s.metadata.similarArtists,
    },
  }));

  for (let i = 0; i < records.length; i += PINECONE_BATCH_SIZE) {
    const { error } = await tryCatch(
      songsIndex.upsert({
        records: records.slice(i, i + PINECONE_BATCH_SIZE),
      }),
    );
    if (error) throw error;
  }
}

// --- Step 5: Mark as ready ---
async function markAsReady(
  toProcess: PreparedSong[],
): Promise<{ upserted: string[]; failed: BatchUpsertResult["failed"] }> {
  const upserted: string[] = [];
  const failed: BatchUpsertResult["failed"] = [];
  const limit = pLimit(5);

  await Promise.all(
    toProcess.map((s) =>
      limit(async () => {
        const { error } = await tryCatch(
          db
            .update(songs)
            .set({
              embeddingStatus: "ready",
              embeddingText: s.embeddingText,
              updatedAt: new Date(),
            })
            .where(eq(songs.songKey, s.songKey)),
        );

        if (error) {
          failed.push({
            songKey: s.songKey,
            error: error instanceof Error ? error.message : String(error),
          });
        } else {
          upserted.push(s.songKey);
        }
      }),
    ),
  );
  return { upserted, failed };
}

// --- Orchestrated - combine all the pieces together --
export async function upsertManySongs(
  rawSongs: SongRawData[],
): Promise<BatchUpsertResult> {
  const result: BatchUpsertResult = {
    upserted: [],
    skipped: [],
    failed: [],
    usage: { totalTokens: 0 },
  };

  const prepared = prepareSongs(rawSongs);
  const { skipped, toProcess } = await filterReadySongs(prepared);

  result.skipped = skipped;

  if (toProcess.length === 0) return result;

  await markAsPending(toProcess);

  const { embeddings, totalTokens } = await getEmbeddings(toProcess);
  result.usage.totalTokens = totalTokens;

  await upsertToPinecone(toProcess, embeddings);

  const { upserted, failed } = await markAsReady(toProcess);
  result.upserted = upserted;
  result.failed = failed;

  return result;
}
