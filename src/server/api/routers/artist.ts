import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { tryCatch } from "~/lib/try-catch";
import { lastFmApi } from "~/lib/music/lastfm";

export const artistRouter = createTRPCRouter({
  getArtistTopTag: protectedProcedure
    .input(z.object({ artist: z.string() }))
    .query(async ({ input }) => {
      const { data } = await tryCatch(
        lastFmApi.getArtistTopTag({ artist: input.artist }),
      );

      if (data?.toptags && typeof data.toptags === "object") {
        return data.toptags;
      }
    }),

  getArtistSimilar: protectedProcedure
    .input(z.object({ artist: z.string() }))
    .query(async ({ input }) => {
      const { data } = await tryCatch(
        lastFmApi.getArtistSimilar({ artist: input.artist }),
      );

      if (
        data?.similarartists.artist &&
        typeof data.similarartists.artist === "object"
      ) {
        return data.similarartists.artist;
      }
    }),
});
