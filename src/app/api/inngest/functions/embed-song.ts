import { inngest } from "~/lib/inngest/client";
import type { InngestEvents } from "../types";
import { fetchLastFmData } from "~/lib/music/lastfm";
import { upsertSong } from "~/lib/pinecone/upsert-song";
import { buildSongKey } from "~/lib/ingestion/sanitise";
import { tryCatch } from "~/lib/utils/try-catch";

function isSkippableError(error: unknown): boolean {
  if (!error) return false;

  if (error instanceof Error) {
    const message = error.message || "";
    // Check for TRPC error codes in message or check instanceof
    if (
      message.includes("NOT_FOUND") ||
      message.includes("BAD_REQUEST") ||
      (error as any).code === "NOT_FOUND" ||
      (error as any).code === "BAD_REQUEST"
    ) {
      return true;
    }
  }

  if (typeof error === "object" && error !== null) {
    const maybeCode = (error as any).code;
    if (maybeCode === "NOT_FOUND" || maybeCode === "BAD_REQUEST") {
      return true;
    }
  }

  return false;
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
  },
  { event: "music/song.embed.requested" satisfies keyof InngestEvents },
  async ({ event, step }) => {
    const { artist, track, userId } = event.data;
    const songKey = buildSongKey(artist, track);

    console.info("[embed-song] start", { userId, artist, track, songKey });

    try {
      // --- Step 1: fetch Last.fm data (cached for artist-level calls) ---
      const { data: lastFmData, error: fetchError } = await tryCatch(
        step.run("fetch-lastfm-data", () => fetchLastFmData(artist, track)),
      );

      // If Last.fm lookup fails with a skippable error (NOT_FOUND, BAD_REQUEST),
      // treat it as a skip without retry.
      if (fetchError) {
        if (isSkippableError(fetchError)) {
          console.info("[embed-song] skipped - Last.fm not found or invalid", {
            userId,
            songKey,
            artist,
            track,
            reason: "skippable_fetch_error",
          });

          await step.sendEvent("emit-completion-skipped-fetch", {
            name: "music/song.embed.completed",
            data: { userId, songKey, status: "skipped" },
          });

          return { status: "skipped", reason: "not_found_on_lastfm", songKey };
        }

        // For non-skippable errors (transient, auth issues), re-throw to allow retry
        console.error("[embed-song] fetch failed (retriable)", {
          userId,
          songKey,
          artist,
          track,
          error: fetchError,
        });
        throw fetchError;
      }

      if (!lastFmData) {
        console.info("[embed-song] skipped - Last.fm returned null", {
          userId,
          songKey,
          artist,
          track,
        });

        await step.sendEvent("emit-completion-skipped-null", {
          name: "music/song.embed.completed",
          data: { userId, songKey, status: "skipped" },
        });

        return { status: "skipped", reason: "null_response", songKey };
      }

      // Check if the track has any tags or useful information
      const hasTrackTags =
        (lastFmData.trackInfo.track?.toptags?.tag?.length ?? 0) > 0;
      const hasArtistTags =
        (lastFmData.artistTopTags.toptags?.tag?.length ?? 0) > 0;

      if (!hasTrackTags && !hasArtistTags) {
        console.info("[embed-song] skipped - empty metadata", {
          userId,
          songKey,
          artist,
          track,
        });

        await step.sendEvent("emit-completion-skipped-empty", {
          name: "music/song.embed.completed",
          data: { userId, songKey, status: "skipped" },
        });

        return { status: "skipped", reason: "empty_metadata", songKey };
      }

      // --- Step 2: Generate embedding + upsert into Pinecone + Postgres ---
      const { data: result, error: upsertError } = await tryCatch(
        step.run("upsert-song", () =>
          upsertSong({
            ...lastFmData,
            identityArtist: artist,
            identityTrack: track,
          }),
        ),
      );

      if (upsertError) {
        if (isSkippableError(upsertError)) {
          console.info(
            "[embed-song] skipped - upsert failed with skippable error",
            {
              userId,
              songKey,
              reason: "skippable_upsert_error",
              error: upsertError,
            },
          );

          await step.sendEvent("emit-completion-skipped-upsert", {
            name: "music/song.embed.completed",
            data: { userId, songKey, status: "skipped" },
          });

          return {
            status: "skipped",
            reason: "upsert_skippable_error",
            songKey,
          };
        }

        // For non-skippable errors, re-throw to allow retry
        console.error("[embed-song] upsert failed (retriable)", {
          userId,
          songKey,
          error: upsertError,
        });
        throw upsertError;
      }

      if (!result) {
        console.info("[embed-song] skipped - upsert returned null", {
          userId,
          songKey,
        });

        await step.sendEvent("emit-completion-skipped-null-upsert", {
          name: "music/song.embed.completed",
          data: { userId, songKey, status: "skipped" },
        });

        return { status: "skipped", reason: "null_upsert_result", songKey };
      }

      await step.sendEvent("emit-completion", {
        name: "music/song.embed.completed",
        data: {
          userId,
          songKey,
          status: result.status,
        },
      });

      console.info("[embed-song] done", {
        userId,
        songKey,
        status: result.status,
      });

      return result;
    } catch (error) {
      // Critical for "stuck awaits" that happened during testing.
      // Always emit completion to unblock playlist waits.
      console.error(
        "[embed-song] failed; emitting skipped to unblock playlist",
        {
          userId,
          artist,
          track,
          songKey,
          error,
        },
      );

      await step.sendEvent("emit-completion-skipped-error", {
        name: "music/song.embed.completed",
        data: { userId, songKey, status: "skipped" },
      });

      return { status: "skipped", reason: "error", songKey };
    }
  },
);
