import { spotifyApi } from "~/lib/music/spotify";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { tryCatch } from "~/lib/utils/try-catch";
import { TRPCError } from "@trpc/server";
import { appRouter } from "../root";
import type { RawTrack } from "~/lib/music/types";

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
          message: "Playlist not found. Or Spotify refused to give it to us.",
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
          message: "Could not load playlist tracks.",
          cause: res.error,
        });
      }

      return res.data;
    }),

  getPlaylistItemsAll: protectedProcedure
    .input(z.object({ playlist_id: z.string() }))
    .query(async ({ input, ctx }) => {
      const caller = appRouter.createCaller(ctx);

      let offset = 0;
      let hasNextBatch = true;

      let allTracks: RawTrack[] = [];

      while (hasNextBatch) {
        const data = await caller.playlist.getPlaylistItems({
          playlist_id: input.playlist_id,
          offset,
          limit: LIMIT,
        });

        if (!data) {
          console.warn(
            `No data received for playlist_id: ${input.playlist_id} at offset: ${offset}`,
          );
          hasNextBatch = false;
          break;
        }

        const tracks = data.items
          .filter((item) => !item.is_local && item.track)
          .map((item) => {
            const track = item.track!;

            return {
              trackName: track.name,
              albumName: track.album.name,
              artistName: track.artists
                .map((artist) => artist.name)
                .join(" & "),
            };
          });

        allTracks.push(...tracks);

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
      z.strictObject({
        playlist_id: z.string(),
        params: z.object({
          track_uris: z.array(z.string()),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      const { playlist_id, params } = input;

      const { data, error } = await tryCatch(
        spotifyApi.addTracksToPlaylist({
          playlist_id,
          requestBody: {
            uris: params.track_uris,
          },
        }),
      );

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Tracks not added.",
        });
      }

      return { snapshot_id: data?.snapshot_id };
    }),

  removePlaylistItems: protectedProcedure
    .input(
      z.object({
        playlist_id: z.string(),
        params: z.object({
          uri: z.string(),
          snapshot_id: z.string(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      const { playlist_id, params } = input;

      const { error } = await tryCatch(
        spotifyApi.removePlaylistItems({
          playlist_id,
          requestBody: {
            tracks: [{ uri: params.uri, snapshot_id: params.snapshot_id }],
          },
        }),
      );

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Track stayed. Removal failed.",
        });
      }

      return { success_msg: "Track removed." };
    }),

  createPlaylist: protectedProcedure
    .input(
      z.object({
        user_id: z.string(),
        name: z.string(),
        isPublic: z.boolean(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { user_id, name, isPublic, description } = input;

      console.log("[create playlist] input: ", {
        user_id,
        name,
        isPublic,
        description,
      });

      const payload = {
        name,
        public: isPublic,
        description,
      };

      console.log("spotify payload", payload);

      const { data, error } = await tryCatch(
        spotifyApi.createPlaylist({
          user_id,
          requestBody: payload,
        }),
      );

      console.log("createPlaylist response", data);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Playlist creation failed.",
        });
      }

      return data;
    }),

  createPlaylistWithTracks: protectedProcedure
    .input(
      z.object({
        user_id: z.string(),
        name: z.string(),
        isPublic: z.boolean(),
        description: z.string().optional(),
        track_uris: z.array(z.string()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { user_id, name, isPublic, description, track_uris } = input;
      const caller = playlistRouter.createCaller(ctx);

      const createPlaylistRes = await caller.createPlaylist({
        name,
        user_id,
        isPublic,
        description,
      });

      if (!createPlaylistRes) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Playlist was not created.",
        });
      }

      const { id: createdPlaylistId } = createPlaylistRes;

      const { error } = await tryCatch(
        spotifyApi.addTracksToPlaylist({
          playlist_id: createdPlaylistId,
          requestBody: {
            uris: track_uris,
          },
        }),
      );

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Playlist exists. Tracks do not.",
        });
      }
    }),
});
