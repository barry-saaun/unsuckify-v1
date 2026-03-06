import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { buildSongKey } from "~/lib/ingestion/sanitise";
import { findSimilarSongs } from "~/lib/pinecone/find-similar-songs";

const RawTrackSchema = z.object({
  artistName: z.string(),
  trackName: z.string(),
  albumName: z.string().optional(),
});

export const recommendationsRouter = createTRPCRouter({
  getForPlaylist: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).optional(),
        minScore: z.number().min(0).max(1).optional(),
        playlist: z.array(RawTrackSchema),
      }),
    )
    .query(async ({ input }) => {
      const songKeys = input.playlist.map(({ artistName, trackName }) =>
        buildSongKey(artistName, trackName),
      );

      const result = await findSimilarSongs({
        playlistSongKeys: songKeys,
        limit: input.limit,
        minScore: input.minScore,
      });

      if (!result.ok) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: result.error,
        });
      }

      return result;
    }),
});
