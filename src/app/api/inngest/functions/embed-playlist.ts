import { inngest } from "~/lib/inngest/client";
import type { InngestEvents } from "../types";
import { buildSongKey } from "~/lib/ingestion/sanitise";
import { fetchSongEmbeddings } from "~/lib/pinecone/fetch-songs-embeddings";
import { findSimilarSongs } from "~/lib/pinecone/find-similar-songs";

export const embedPlaylistFunction = inngest.createFunction(
  {
    id: "embed-playlist",
    name: "Embed Playlist & Get Recommendations",
    concurrency: [
      {
        limit: 1,
        key: "event.data.userId",
      },
      {
        limit: 5,
        scope: "fn",
      },
    ],
    retries: 2,
  },
  {
    event: "music/playlist.embed.requested" satisfies keyof InngestEvents,
  },
  async ({ event, step }) => {
    const { playlist, userId, mode } = event.data;

    const songKeys = playlist.map((s) => buildSongKey(s.artist, s.track));

    // --- Step 1: Check which songs are already embedded ---
    const { missing } = await step.run("check-existing-embeddings", () =>
      fetchSongEmbeddings(songKeys),
    );

    // --- Step 2: Fan out embed jobs for missing songs ---
    if (missing.length > 0) {
      const missingKeysSet = new Set(missing);

      const missingSongs = playlist.filter((s) =>
        missingKeysSet.has(buildSongKey(s.artist, s.track)),
      );

      await step.sendEvent(
        "fan-out-missing-songs",
        missingSongs.map((s) => ({
          name: "music/song.embed.requested" as const,
          data: {
            userId,
            artist: s.artist,
            track: s.track,
          },
        })),
      );

      // ============================
      // SEED MODE -> STOP HERE
      // ============================
      if (mode === "seed") {
        return {
          userId,
          status: "seeded",
          total: songKeys.length,
          missing,
        };
      }

      // ============================
      // RECOMMEND MODE -> SHORT WAIT BUDGET (FOR BETTER UX)
      // ============================

      if (missing.length > 0) {
        const missingKeySets = new Set(missing);

        const missingSongs = playlist.filter((s) =>
          missingKeySets.has(buildSongKey(s.artist, s.track)),
        );

        // short 5s wait budget
        await Promise.allSettled(
          missingSongs.map((s) => {
            const songKey = buildSongKey(s.artist, s.track);

            // Not using the song key for better logging identification
            const stepId = `wait-for-${s.track} - ${s.artist}`;

            return step.waitForEvent(stepId, {
              event: "music/song.embed.completed",
              timeout: "5s",
              if: `async.data.userId == "${userId}" && async.data.songKey == "${songKey}"`,
            });
          }),
        );
      }
    }

    // --- Re-fetch embeddings after short waits ---
    const { found: updatedFound } = await step.run("refetch-embeddings", () =>
      fetchSongEmbeddings(songKeys),
    );

    if (updatedFound.length < 3) {
      return {
        userId,
        status: "warming-up",
        embedded: updatedFound.length,
      };
    }

    // --- Step 4: Run similarity search ---
    const recommendations = await step.run("find-similar-songs", () =>
      findSimilarSongs({
        playlistSongKeys: songKeys,
        limit: 20,
        minScore: 0.6,
      }),
    );

    return {
      userId,
      recommendations,
      status: "ready",
      embedded: updatedFound.length,
    };
  },
);
