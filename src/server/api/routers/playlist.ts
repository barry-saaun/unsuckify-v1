import { spotifyApi } from "~/lib/spotify";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { tryCatch } from "~/lib/try-catch";
import { TRPCError } from "@trpc/server";

export const playlistRouter = createTRPCRouter({
  getPlaylist: protectedProcedure
    .input(
      z.object({
        playlist_id: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const res = await tryCatch(
        spotifyApi.getSinglePlaylistResponse(input.playlist_id),
      );

      if (res.error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          // message:
          //   "Invalid Spotify Playlist ID. Please check the ID and try again.",
          message:
            "It looks like the Spotify Playlist ID you provide might be invalid or the playlist doesn&apos;t exist.\n Please double-check the ID and try again.",
          cause: res.error,
        });
      }

      return res.data;
    }),
});
