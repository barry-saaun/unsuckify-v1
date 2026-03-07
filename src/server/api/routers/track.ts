import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { spotifyApi } from "~/lib/music/spotify";

export const trackRouter = createTRPCRouter({
  searchForTracks: protectedProcedure
    .input(
      z.object({
        track: z.string(),
        album: z.string(),
        artists: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { track, artists } = input;

      // 1. Build a cleaner query.
      // We combine them but avoid strict field prefixes to allow for fuzzy matching.
      const artistName = Array.isArray(artists)
        ? artists[0]
        : artists?.split(",")[0];

      // Attempt 1: Strict-ish search
      let query = `${track} ${artistName || ""}`.trim();

      console.log(`[searchForTrack query]:`, query);

      const result = await spotifyApi.searchForTrack({
        q: query,
        type: "track",
        limit: 1,
      });

      const items = result?.tracks?.items;

      if (!items || items.length === 0) {
        // Optional: Fallback logic here if primary search fails
        return null;
      }

      const firstTrack = items[0];

      // Use optional chaining and provide a fallback image if possible
      const albumImage = firstTrack?.album?.images?.[0]?.url || null;
      const trackUri = firstTrack?.uri;

      return { trackUri, albumImage };
    }),
});
