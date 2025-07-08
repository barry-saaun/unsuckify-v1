import { spotifyApi } from "~/lib/spotify";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { tryCatch } from "~/lib/try-catch";
import { TRPCError } from "@trpc/server";
import { appRouter } from "../root";

const LIMIT = 20;

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
          message:
            "It looks like the Spotify Playlist ID you provide might be invalid or the playlist doesn&apos;t exist.\n Please double-check the ID and try again.",
          cause: res.error,
        });
      }

      return res.data;
    }),

  getPlaylistItems: protectedProcedure
    .input(
      z.object({
        playlist_id: z.string(),
        offset: z.number(),
        limit: z.number(),
      }),
    )
    .query(async ({ input }) => {
      const res = await tryCatch(spotifyApi.getPlaylistItems(input));

      if (res.error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "It looks like the Spotify Playlist ID you provide might be invalid or the playlist doesn&apos;t exist.\n Please double-check the ID and try again.",
          cause: res.error,
        });
      }

      return res.data;
    }),

  getPlaylistItemsAll: protectedProcedure
    .input(z.object({ playlist_id: z.string() }))
    .query(async ({ input, ctx }) => {
      const caller = appRouter.createCaller({
        headers: ctx.headers,
        authenticated: ctx.authenticated,
        accessToken: ctx.accessToken,
        db: ctx.db,
      });

      let offset = 0;

      let allTracks: string[] = [];

      let hasNextBatch = true;

      while (hasNextBatch) {
        const data = await caller.playlist.getPlaylistItems({
          playlist_id: input.playlist_id,
          offset,
          limit: LIMIT,
        });

        const trackStr = data.items
          .filter((item) => !item.is_local && item.track)
          .map((item) => {
            const track = item.track;

            const trackName = track?.name;
            const albumName = track?.album.name;

            const artistsName = track?.artists
              .map((artist) => artist.name)
              .join(" & ");
            return `${trackName} - (${artistsName}) - ${albumName}`;
          });

        allTracks = [...allTracks, ...trackStr];

        if (!data.next) {
          hasNextBatch = false;
          break;
        }

        offset += LIMIT;
      }

      return allTracks;
    }),
  addItemsToPlaylist: protectedProcedure
    .input(
      z.object({ playlist_id: z.string(), track_uris: z.array(z.string()) }),
    )
    .mutation(async ({ input }) => {
      const { playlist_id, track_uris } = input;

      const { data, error } = await tryCatch(
        spotifyApi.addTracksToPlaylist({
          playlist_id,
          requestBody: {
            uris: track_uris,
          },
        }),
      );

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Sorry! We could not add this track to your playlist at the moment.",
        });
      }
      return data;
    }),
    }),
});
