import { inngest } from "~/lib/inngest/client";
import type { InngestEvents } from "../types";
import { buildSongKey } from "~/lib/ingestion/sanitise";
import { fetchSongEmbeddings } from "~/lib/pinecone/fetch-songs-embeddings";
import { findSimilarSongs } from "~/lib/pinecone/find-similar-songs";
export const embedPlaylistFunction = inngest.createFunction(
  {
    id: "embed-playlist",
    name: "Embed Playlist & Get Recommendations",
    concurrency: {
      limit: 1,
      key: "event.data.userId",
    },
    retries: 2,
  },
  {
    event: "music/playlist.embed.requested" satisfies keyof InngestEvents,
  },
  async ({ event, step }) => {
    const { playlist, userId } = event.data;

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

      // --- Step 3: Wait for each missing song to complete individually ---
      await Promise.all(
        missingSongs.map((s) => {
          const songKey = buildSongKey(s.artist, s.track);

          // better log, no need for the entire hash
          const stepId = `wait-for-${s.artist}-${s.track}-${songKey}`.slice(
            0,
            50,
          );

          return step.waitForEvent(stepId, {
            event: "music/song.embed.completed",
            timeout: "5m",
            if: `async.data.userId == "${userId}" && async.data.songKey == "${songKey}"`,
          });
        }),
      );
    }

    // --- Step 4: Run similarity search ---
    const recommendations = await step.run("find-similar-songs", () =>
      findSimilarSongs({
        playlistSongKeys: songKeys,
        limit: 20,
        minScore: 0.6,
      }),
    );

    return { userId, recommendations };
  },
);
