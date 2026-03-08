import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { spotifyApi } from "~/lib/music/spotify";
import { songs } from "~/server/db/schema";

export const trackRouter = createTRPCRouter({
  searchForTrack: protectedProcedure
    .input(
      z.object({
        songKey: z.string(),
        track: z.string(),
        album: z.string(),
        artists: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { track, artists, songKey, album } = input;

      console.log("[searchForTracks] start", {
        songKey,
        track,
        album,
        artists,
      });

      // 1. Checking DB first before query
      const existing = await ctx.db.query.songs.findFirst({
        where: (songs, { eq }) => eq(songs.songKey, songKey),
      });

      if (existing?.trackUri) {
        return { trackUri: existing.trackUri, albumImage: existing.albumImage };
      }

      console.log("[searchForTracks] cache miss", {
        songKey,
      });

      // 2. Cache missed - query api
      const artistName = Array.isArray(artists)
        ? artists[0]
        : artists?.split(",")[0];

      // Attempt 1: Strict-ish search
      let query = `${track} ${artistName || ""}`.trim();

      const result = await spotifyApi.searchForTrack({
        q: query,
        type: "track",
        limit: 1,
      });

      const firstTrack = result?.tracks.items?.[0];

      if (!firstTrack) {
        console.log("[searchForTracks] spotify no result", {
          songKey,
          query,
        });

        return null;
      }

      // Use optional chaining and provide a fallback image if possible
      const trackUri = firstTrack.uri ?? null;
      const albumImage = firstTrack.album.images[0]?.url ?? null;

      console.log("[searchForTracks] spotify result found", {
        songKey,
        trackUri,
        albumImage,
        spotifyTrackName: firstTrack.name,
        spotifyArtistNames:
          firstTrack.artists?.map((artist) => artist.name).join(", ") ?? "",
      });

      // 3. Persist in DB
      await ctx.db
        .insert(songs)
        .values({
          songKey,
          track: input.track,
          album: input.album,
          artist: input.artists,
          trackUri,
          albumImage,
        })
        .onConflictDoUpdate({
          target: songs.songKey,
          set: { trackUri, albumImage, updatedAt: new Date() },
        });

      return { trackUri, albumImage };
    }),
});
