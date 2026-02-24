import { inngest } from "~/lib/inngest/client";
import type { InngestEvents } from "../types";
import { fetchLastFmData } from "~/lib/music/lastfm";
import { upsertSong } from "~/lib/pinecone/upsert-song";

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

    // --- Step 1: fetch Last.fm data (cached for artist-level calls) ---
    const lastFmData = await step.run("fetch-lastfm-data", () =>
      fetchLastFmData(artist, track),
    );

    // --- Step 2: Generate embedding + upsert into Pinecone + Postgres ---
    const result = await step.run("upsert-song", () => upsertSong(lastFmData));

    await step.sendEvent("emit-completion", {
      name: "music/song.embed.completed",
      data: {
        userId,
        songKey: result.songKey,
        status: result.status,
      },
    });
    return result;
  },
);
