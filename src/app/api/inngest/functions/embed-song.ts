import { inngest } from "~/lib/inngest/client";
import type { InngestEvents } from "../types";
import { upsertSong } from "~/lib/pinecone/upsert-song";
import { buildSongKey } from "~/lib/ingestion/sanitise";
import { tryCatch } from "~/lib/utils/try-catch";
import { fetchLastFmData } from "~/lib/music/lastfm";

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
  async ({ event, step }) => {
    const { artist, track, userId } = event.data;
    const songKey = buildSongKey(artist, track);

    console.info("[embed-song] start", { userId, artist, track, songKey });

    try {
      // --- Step 1: fetch Last.fm data ( cached for artist-level calls) ---
      const lastFmData = await step.run("fetch-lastfm-data", async () => {
        const { data, error } = await tryCatch(fetchLastFmData(artist, track));

        if (error) {
          if (isNotFoundError(error)) {
            console.info("[embed-song] lastfm not found", {
              userId,
              songKey,
              artist,
              track,
            });
            return null;
          }

          // for any other error, throw so Inngest can retry
          console.error("[embed-song] lastfm error", {
            userId,
            songKey,
            artist,
            track,
            error,
          });
          throw error;
        }

        return data;
      });

      if (!lastFmData) {
        await step.sendEvent("emit-completion-skipped-not-found", {
          name: "music/song.embed.completed",
          data: { userId, songKey, status: "skipped" },
        });

        return { status: "skipped", reason: "not_found_on_lastfm", songKey };
      }

      // Check if the track has any tags or useful information
      const hasTrackTags =
        (lastFmData.trackInfo.track?.toptags?.tag?.length ?? 0) > 0;
      const hasArtistTags =
        (lastFmData.artistTopTags.toptags?.tag?.length ?? 0) > 0;

      if (!hasTrackTags && !hasArtistTags) {
        console.info("[embed-song] skipped empty metadata", {
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
      const result = await step.run("upsert-song", () =>
        upsertSong({
          ...lastFmData,
          identityArtist: artist,
          identityTrack: track,
        }),
      );

      await step.sendEvent("emit-completion", {
        name: "music/song.embed.completed",
        data: {
          userId,
          // Always emit the identity-derived key so playlist waits never hang.
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
      // Critical for "stuck awaits" that happended during testing
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
