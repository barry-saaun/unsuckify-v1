import { inngest } from "~/lib/inngest/client";
import type { InngestEvents } from "../types";
import { buildSongKey } from "~/lib/ingestion/sanitise";
import { fetchSongEmbeddings } from "~/lib/pinecone/fetch-songs-embeddings";
import { findSimilarSongs } from "~/lib/pinecone/find-similar-songs";
import { db } from "~/server/db";
import { songs } from "~/server/db/schema";
import { inArray } from "drizzle-orm";

const SKIP_STATUS = new Set<string>(["ready", "no_metadata", "pending"]);

const EMBED_AWAIT_SLEEP = "10s";

// Minimum number of embedded songs required to attempt recommendations.
const MIN_EMBEDDINGS_FOR_RECOMMENDATIONS = 3;

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

    // -- DB: Pre-check
    const existingRows = await db
      .select({
        songKey: songs.songKey,
        embeddingStatus: songs.embeddingStatus,
      })
      .from(songs)
      .where(inArray(songs.songKey, songKeys));

    const statusMap = new Map(
      existingRows.map((r) => [r.songKey, r.embeddingStatus]),
    );

    const songsToEmbed = playlist.filter((s) => {
      const status = statusMap.get(buildSongKey(s.artist, s.track));
      return !status || !SKIP_STATUS.has(status);
    });

    const skippedCount = playlist.length - songsToEmbed.length;

    console.info("[embed-playlist] db pre-check", {
      userId,
      total: songKeys.length,
      toEmbed: songsToEmbed.length,
      skipped: skippedCount,
    });

    if (songsToEmbed.length > 0) {
      await step.sendEvent(
        "fan-out-songs-to-embed",
        songsToEmbed.map((s) => ({
          name: "music/song.embed.requested" as const,
          data: { userId, artist: s.artist, track: s.track },
        })),
      );
    }

    // ============================
    // SEED MODE -> STOP HERE
    // ============================
    if (mode === "seed") {
      return {
        userId,
        status: "seeded",
        total: songKeys.length,
        queued: songsToEmbed.length,
        skipped: skippedCount,
      };
    }

    // ============================
    // RECOMMEND MODE -> SHORT WAIT BUDGET (FOR BETTER UX)
    // ============================
    if (songsToEmbed.length > 0) {
      await step.sleep("wait-for-embeddings", EMBED_AWAIT_SLEEP);
    }

    const { found } = await step.run("refetch-embeddings", () =>
      fetchSongEmbeddings(songKeys),
    );

    if (found.length < MIN_EMBEDDINGS_FOR_RECOMMENDATIONS) {
      return {
        userId,
        status: "warming-up",
        embedded: found.length,
        total: songKeys.length,
      };
    }

    const recommendations = await step.run("find-similar-songs", () =>
      findSimilarSongs({
        playlistSongKeys: songKeys,
        limit: 20,
        minScore: 0.6,
      }),
    );

    return {
      userId,
      status: "ready",
      embedded: found.length,
      total: songKeys.length,
      recommendations,
    };
  },
);
