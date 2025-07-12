import { spotifyApi } from "~/lib/spotify";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { tryCatch } from "~/lib/try-catch";
import { TRPCError } from "@trpc/server";
import { appRouter } from "../root";
import { trackPlaylistStatus } from "~/server/db/schema";
import { and, eq } from "drizzle-orm";

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
      const caller = appRouter.createCaller(ctx);

      let offset = 0;

      let allTracks: string[] = [];

      let hasNextBatch = true;

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
          hasNextBatch = false; // Stop fetching if data is null
          break;
        }

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
      z.object({
        playlist_id: z.string(),
        track_uris: z.array(z.string()),
        batchId: z.number(),
        trackId: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { playlist_id, track_uris, batchId, trackId } = input;

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

      const addedStatus = "added";
      console.log("snapshot_id:", data?.snapshot_id);
      console.log("batchId:", batchId);
      console.log("track_id:", trackId);

      const trackLocationInTable = and(
        eq(trackPlaylistStatus.batchId, batchId),
        eq(trackPlaylistStatus.trackId, trackId),
      );

      // insert the snapshot id to the status table
      await Promise.all([
        ctx.db
          .update(trackPlaylistStatus)
          .set({ snapshotId: data?.snapshot_id })
          .where(trackLocationInTable),
        ctx.db
          .update(trackPlaylistStatus)
          .set({ status: addedStatus })
          .where(and(trackLocationInTable)),
      ]);

      return { snapshot_id: data?.snapshot_id, status: addedStatus };
    }),
  removePlaylistItems: protectedProcedure
    .input(
      z.object({
        playlist_id: z.string(),
        track_uris: z.string(),
        snapshot_id: z.string(),
        batchId: z.number(),
        trackId: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { playlist_id, track_uris, snapshot_id, batchId, trackId } = input;

      const { error } = await tryCatch(
        spotifyApi.removePlaylistItems({
          playlist_id,
          requestBody: { tracks: [{ uri: track_uris, snapshot_id }] },
        }),
      );

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Sorry! We could not remove this track from the playlist at the moment.",
        });
      }

      const trackLocationInTable = and(
        eq(trackPlaylistStatus.batchId, batchId),
        eq(trackPlaylistStatus.trackId, trackId),
      );

      const removedStatus = "removed";

      // insert the snapshot id to the status table
      await Promise.all([
        ctx.db
          .update(trackPlaylistStatus)
          .set({ snapshotId: null })
          .where(trackLocationInTable),
        ctx.db
          .update(trackPlaylistStatus)
          .set({ status: removedStatus })
          .where(and(trackLocationInTable)),
      ]);

      return { success_msg: "Poof! The song is out of your playlist" };
    }),
});
