import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getRecommendations } from "~/lib/pinecone/get-recommendations";

const RawTrackSchema = z.object({
  artistName: z.string(),
  trackName: z.string(),
  albumName: z.string().optional(),
});

export const recommendationsRouter = createTRPCRouter({
  getForPlaylist: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(200).optional(),
        minScore: z.number().min(0).max(1).optional(),
        playlist: z.array(RawTrackSchema),
      }),
    )
    .query(async ({ input }) => {
      try {
        return await getRecommendations({
          playlist: input.playlist.map(({ artistName, trackName }) => ({
            artist: artistName,
            track: trackName,
          })),
          limit: input.limit,
          minScore: input.minScore ?? 0.6,
        });
      } catch (err) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }),
});
