import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { inngest } from "~/lib/inngest/client";
import { DEV_SEED_PLAYLIST } from "~/lib/music/seed/hardcoded-playlists";
import { fetchPlaylistTracksAll } from "./fetch-playlist-tracks";

async function main() {
  for (const playlist of DEV_SEED_PLAYLIST) {
    console.log(`[Seeding]: ${playlist.label}`);

    const match = playlist.id.match(/playlist\/([a-zA-Z0-9]+)(?:\?|$)/);

    const playlistId = match?.[1];

    const tracks = await fetchPlaylistTracksAll(playlistId!);

    await inngest.send({
      name: "music/playlist.embed.requested",
      data: {
        userId: "seed-dev",
        playlist: tracks.map((param) => ({
          artist: param.artist,
          track: param.track,
        })),
        mode: "seed",
      },
    });

    console.log(`Triggered ingestion for ${tracks.length} tracks`);
  }

  console.log("✅ Seeding complete");
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
