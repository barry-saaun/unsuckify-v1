import { spotifyApi } from "~/lib/spotify";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const playlistRouter = createTRPCRouter({
  getPlaylist: protectedProcedure
    .input(
      z.object({
        playlist_id: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const p_data = await spotifyApi.getSinglePlaylistResponse(
        input.playlist_id,
      );

      return p_data;
    }),
});
