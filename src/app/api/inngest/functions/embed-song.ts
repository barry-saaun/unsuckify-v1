import { inngest } from "~/lib/inngest/client";
import type { InngestEvents } from "../types";
import { upsertSong } from "~/lib/pinecone/upsert-song";
import { buildSongKey } from "~/lib/ingestion/sanitise";
import { tryCatch } from "~/lib/utils/try-catch";
import { fetchLastFmData } from "~/lib/music/lastfm";
import type { GetFunctionInput } from "inngest";
import type { EmbeddingCheckResult, EmbedJobResult } from "~/lib/music/types";
import { db } from "~/server/db";
import { songs } from "~/server/db/schema";
import { eq, ne } from "drizzle-orm";

type StepTool = GetFunctionInput<typeof inngest>["step"];

async function emitCompletion(
  step: StepTool,
  stepId: string,
  payload: InngestEvents["music/song.embed.completed"]["data"],
) {
  await step.sendEvent(stepId, {
    name: "music/song.embed.completed",
    data: payload,
  });
}

export const embedSongFunction = inngest.createFunction(
  {
    id: "embed-song",
    name: "Embed Single Song",
    rateLimit: {
      // Last.fm allows 5 req/sec - we embed one song at a time here
      // This caps at 3/sec to leave room
      limit: 3,
      period: "1s",
      key: "event.data.artist", // per-artist rate limiting
    },
    retries: 2,
  },
  { event: "music/song.embed.requested" satisfies keyof InngestEvents },
  async ({ event, step }): Promise<EmbedJobResult> => {
    const { artist, track, userId } = event.data;
    const songKey = buildSongKey(artist, track);

    console.info("[embed-song] start", { userId, artist, track, songKey });

    // DB pre-check: no step cost, exist before touching last.fm
    const preCheck = await checkEmbeddingStatus(step, songKey, userId);

    if (preCheck.skip) return preCheck.result;

    try {
      // --- Step 1: fetch Last.fm data ( cached for artist-level calls) ---
      const lastFmData = await fetchLastFmStep(
        step,
        artist,
        track,
        songKey,
        userId,
      );
      if (!lastFmData) {
        await step.run("mark-no-metadata", () => {
          markNotFoundOnLastFm(artist, track);
        });

        await emitCompletion(step, "emit-completion-not-found", {
          outcome: "skipped",
          reason: "not_found_on_lastfm",
          songKey,
          userId,
        });

        return {
          outcome: "skipped",
          userId,
          songKey,
          reason: "not_found_on_lastfm",
        };
      }

      // Check if the track has any tags or useful information
      if (!hasUsefulMetadata(lastFmData)) {
        await step.run("mark-no-metadata", () => {
          markNotFoundOnLastFm(artist, track);
        });

        await emitCompletion(step, "emit-completion-no-metadata", {
          userId,
          songKey,
          outcome: "skipped",
          reason: "no_metadata",
        });

        return { outcome: "skipped", userId, songKey, reason: "no_metadata" };
      }

      // --- Step 3: Generate embedding + upsert into Pinecone + Postgres ---
      const result = await step.run("upsert-song", () =>
        upsertSong(userId, {
          ...lastFmData,
          identityArtist: artist,
          identityTrack: track,
        }),
      );

      if (result.outcome === "embedded") {
        await emitCompletion(step, "emit-completion", result);

        console.info("[embed-song] done", {
          userId,
          songKey,
          status: result.outcome,
        });
      }

      return result;
    } catch (error) {
      // Emit skipped on any unhandled error to unblock downstream playlist awaits
      console.error("[embed-song] failed", {
        userId,
        artist,
        track,
        songKey,
        error,
      });

      await emitCompletion(step, "emit-skipped-error", {
        userId,
        songKey,
        outcome: "skipped",
        reason: "error",
      });

      return { outcome: "skipped", reason: "error", songKey, userId };
    }
  },
);

async function markNotFoundOnLastFm(artist: string, track: string) {
  const songKey = buildSongKey(artist, track);

  await db
    .insert(songs)
    .values({
      songKey,
      artist,
      track,
      embeddingStatus: "no_metadata",
    })
    .onConflictDoUpdate({
      target: songs.songKey,
      set: {
        embeddingStatus: "no_metadata",
        updatedAt: new Date(),
      },
      setWhere: ne(songs.embeddingStatus, "ready"),
    });
}

async function checkEmbeddingStatus(
  step: StepTool,
  songKey: string,
  userId: string,
): Promise<EmbeddingCheckResult> {
  const existing = await db
    .select({ embeddingStatus: songs.embeddingStatus })
    .from(songs)
    .where(eq(songs.songKey, songKey))
    .limit(1);

  const status = existing[0]?.embeddingStatus;

  if (status === "ready") {
    console.info("[embed-song] already ready, skipping...", {
      userId,
      songKey,
    });
    await emitCompletion(step, "emit-completion-ready", {
      userId,
      songKey,
      outcome: "skipped",
      reason: "pre_ready",
    });

    return {
      skip: true,
      result: {
        outcome: "skipped",
        reason: "pre_ready",
        songKey,
        userId,
      },
    };
  }

  if (status === "no_metadata") {
    console.info("[embed-song] already no_metadata, skipping...", {
      userId,
      songKey,
    });

    return {
      skip: true,
      result: {
        userId,
        songKey,
        outcome: "skipped",
        reason: "no_metadata",
      },
    };
  }

  return {
    skip: false,
  };
}

async function fetchLastFmStep(
  step: StepTool,
  artist: string,
  track: string,
  songKey: string,
  userId: string,
) {
  return step.run("fetch-lastfm-data", async () => {
    const { data, error } = await tryCatch(fetchLastFmData(artist, track));

    if (!error) return data;

    if (isNotFoundError(error)) {
      console.info("[embed-song] lastfm not found", {
        userId,
        songKey,
        artist,
        track,
      });
      return null;
    }

    console.error("[embed-song] lastfm error", {
      userId,
      songKey,
      artist,
      track,
      error,
    });
    throw error;
  });
}

function isNotFoundError(error: unknown): boolean {
  if (!error) return false;

  if (error instanceof Error && error.message.includes("NOT_FOUND")) {
    return true;
  }

  if (typeof error === "object" && "code" in error) {
    return error.code === "NOT_FOUND";
  }

  return false;
}

function hasUsefulMetadata(
  lastFmData: Awaited<ReturnType<typeof fetchLastFmData>>,
): boolean {
  const hasTrackTags =
    (lastFmData.trackInfo.track?.toptags?.tag?.length ?? 0) > 0;
  const hasArtistTags =
    (lastFmData.artistTopTags.toptags?.tag?.length ?? 0) > 0;
  return hasTrackTags || hasArtistTags;
}
