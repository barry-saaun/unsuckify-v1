import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { spotifyApi } from "~/lib/music/spotify";
import { songs } from "~/server/db/schema";
import { TRPCError } from "@trpc/server";
import { deezerApi } from "~/lib/music/deezer";
import { eq } from "drizzle-orm";

export const trackRouter = createTRPCRouter({
  deezerSearchForPreviewUrl: protectedProcedure
    .input(
      z.object({
        songKey: z.string(),
        track: z.string(),
        album: z.string(),
        artists: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { track, artists, album, songKey } = input;

      // 1. Check DB first before query
      const existing = await ctx.db.query.songs.findFirst({
        where: (songs, { eq }) => eq(songs.songKey, songKey),
      });

      if (existing?.previewUrl) {
        return { previewUrl: existing.previewUrl };
      }

      const { data } = await deezerApi.getTrackSearch({
        artistName: artists,
        trackName: track,
        albumName: album,
      });

      const firstTrack = data[0];

      if (!firstTrack) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No previrw url for track:${track}, album:${album}, artist:${artists}`,
        });
      }

      const previewUrl = firstTrack.preview;

      if (!previewUrl) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No preview URL found for track: ${track}`,
        });
      }

      await ctx.db
        .update(songs)
        .set({ previewUrl: previewUrl })
        .where(eq(songs.songKey, songKey));

      return { previewUrl };
    }),
  spotifySearchForTrack: protectedProcedure
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

        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No result for ${query}`,
        });
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
