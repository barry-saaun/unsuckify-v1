import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { inngest } from "~/lib/inngest/client";
import { DEV_SEED_PLAYLIST } from "~/lib/music/seed/hardcoded-playlists";
import { fetchPlaylistTracksAll } from "./fetch-playlist-tracks";

/**
 * Sleep utility function to respect rate limits
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  for (
    let playlistIndex = 0;
    playlistIndex < DEV_SEED_PLAYLIST.length;
    playlistIndex++
  ) {
    const playlist = DEV_SEED_PLAYLIST[playlistIndex]!;
    console.log(`[Seeding]: ${playlist.label}`);

    // const match = playlist.id.match(/playlist\/([a-zA-Z0-9]+)(?:\?|$)/);
    //
    // const playlistId = match?.[1];

    const tracks = await fetchPlaylistTracksAll(playlist.id);

    // Split tracks into chunks of 100 for rate limiting
    const CHUNK_SIZE = 100;
    const chunks: Array<typeof tracks> = [];
    for (let i = 0; i < tracks.length; i += CHUNK_SIZE) {
      chunks.push(tracks.slice(i, i + CHUNK_SIZE));
    }

    // Process each chunk with a 10-second delay between them
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex]!;

      await inngest.send({
        name: "music/playlist.embed.requested",
        data: {
          userId: "seed-dev",
          playlist: chunk.map((param) => ({
            artist: param.artist,
            track: param.track,
          })),
          mode: "recommend",
        },
      });

      console.log(
        `Triggered ingestion for chunk ${chunkIndex + 1}/${chunks.length} (${chunk.length} tracks)`,
      );

      // Add 10-second delay between chunks if there are more chunks coming
      if (chunkIndex < chunks.length - 1) {
        console.log(`⏳ Waiting 10 seconds before next chunk...`);
        await sleep(10000);
      }
    }

    console.log(
      `✅ Completed: ${tracks.length} tracks from "${playlist.label}"`,
    );

    // Add 10-second delay between playlists if there are more playlists coming
    if (playlistIndex < DEV_SEED_PLAYLIST.length - 1) {
      console.log(`⏳ Waiting 10 seconds before next playlist...`);
      await sleep(10000);
    }
  }

  console.log("✅ Seeding complete");
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
