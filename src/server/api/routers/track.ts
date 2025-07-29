import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import {
  GetOrCreateRecommendationsSchema,
  RecommendedTrackObjectSchema,
  RecommendedTracksSchema,
  type HandleRecommendationTracksReturn,
  type TRecommendedTracks,
} from "~/types";
import { systemPrompt } from "~/constants/system-prompt";
import SuperJSON from "superjson";
import {
  recommendationBatches,
  recommendationTracks,
  trackPlaylistStatus,
  type TracksStatusInsertType,
} from "~/server/db/schema";
import { and, eq, gte } from "drizzle-orm";
import { ensureUserExistence } from "~/lib/utils/user";
import { TRPCError } from "@trpc/server";
import {
  deleteExpiredTables,
  getFirstTrackOfBatchId,
  insertRecommendedTracks,
  insertTracksStatus,
} from "~/lib/utils/track";
import { spotifyApi } from "~/lib/spotify";

export const trackRouter = createTRPCRouter({
  getRecommendations: protectedProcedure
    .input(z.array(z.string()))
    .query(async ({ input }) => {
      const { object } = await generateObject({
        model: google("gemini-2.0-flash"),
        prompt: SuperJSON.stringify(input),
        schema: RecommendedTracksSchema,
        system: systemPrompt,
        schemaName: "Recommendations",
      });

      if (!object) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Failed to generate recommendations.\nThe AI model did not return valid recommendations.",
        });
      }

      return object;
    }),
  getRecommendationsMutate: protectedProcedure
    .input(z.array(z.string()))
    .mutation(async ({ input, ctx }): Promise<TRecommendedTracks> => {
      const caller = trackRouter.createCaller(ctx);
      return await caller.getRecommendations(input);
    }),

  pushRecommendations: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        playlist_id: z.string(),
        recommendations: RecommendedTracksSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ensureUserExistence({ input, ctx });

      const [batch] = await ctx.db
        .insert(recommendationBatches)
        .values({
          userId: input.userId,
          playlistId: input.playlist_id,
          generatedAt: new Date(),
        })
        .returning();

      if (!batch) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create recommendation batch.",
        });
      }

      const tracksToInsert = input.recommendations.map((rec) => ({
        track: rec.track,
        album: rec.album,
        artists: rec.artists,
        year: rec.year,
        batchId: batch?.id,
      }));

      const { tracks } = await insertRecommendedTracks({ ctx, tracksToInsert });

      const tracksStatusToInsert: TracksStatusInsertType[] = tracks.map(
        (track) => ({
          batchId: track.batchId,
          trackId: track.id,
        }),
      );

      await insertTracksStatus({ ctx, tracksStatusToInsert });

      // await ctx.db.insert(recommendationTracks).values(tracksToInsert);
      return { success: true, batchId: batch.id };
    }),

  getLatestBatch: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        playlist_id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(recommendationBatches)
        .where(
          and(
            eq(recommendationBatches.userId, input.userId),
            eq(recommendationBatches.playlistId, input.playlist_id),
          ),
        );
      const latestBatch = rows[0] ?? null;

      return latestBatch;
    }),
  getOrCreateRecommendations: protectedProcedure
    .input(GetOrCreateRecommendationsSchema)
    .query(
      async ({ ctx, input }): Promise<HandleRecommendationTracksReturn> => {
        const { latestBatchInput } = input;
        console.log("latestbatchinput:", latestBatchInput);

        const caller = trackRouter.createCaller(ctx);
        const latestBatch =
          latestBatchInput ?? (await caller.getLatestBatch(input));

        const now = new Date();
        let within24hours = false;
        let batchId = null;
        let timeLeft: number | null = null;

        if (latestBatch) {
          batchId = latestBatch.id;
          const generatedAt = latestBatch.generatedAt;
          const msSince = now.getTime() - generatedAt.getTime();
          const ms24h = 24 * 60 * 60 * 1000;

          within24hours = msSince < ms24h;
          if (within24hours) {
            timeLeft = ms24h - msSince;
          } else {
            await deleteExpiredTables({ ctx, batchId });
          }
        }

        console.log("[track]: batchId", batchId);

        // Case 1: Data exists and is fresh (not expired)
        if (within24hours && batchId) {
          console.log(`Attempting to select tracks for batchId: ${batchId}`);
          const resolvedTracks = await ctx.db
            .select()
            .from(recommendationTracks)
            .where(eq(recommendationTracks.batchId, batchId));

          return {
            resolvedTracks: resolvedTracks.map((track) => ({
              track: track.track,
              album: track.album,
              artists: track.artists,
              year: track.year,
            })),
            timeLeft,
            batchId,
            success: true,
          };
        }

        console.log("[track]: input new track", input.newTracks);

        // gracefully handle the case where it's undefined
        if (!input.newTracks) {
          return {
            resolvedTracks: [],
            timeLeft: null,
            success: false,
            batchId: null,
          };
        }

        const result = await caller.pushRecommendations({
          userId: input.userId,
          playlist_id: input.playlist_id,
          recommendations: input.newTracks,
        });

        console.log("[pushRec]: is called");

        if (!result.success) {
          console.log("log from !success");
          return {
            resolvedTracks: [],
            timeLeft: new Date().getTime(),
            success: false,
            batchId: null,
          };
        }
        batchId = result.batchId;
        timeLeft = 24 * 60 * 60 * 1000;

        return {
          resolvedTracks: input.newTracks,
          timeLeft,
          success: true,
          batchId,
        };
      },
    ),

  getOrCreateRecommendationsMutate: protectedProcedure
    .input(GetOrCreateRecommendationsSchema)
    .mutation(
      async ({ ctx, input }): Promise<HandleRecommendationTracksReturn> => {
        const caller = trackRouter.createCaller(ctx);
        return await caller.getOrCreateRecommendations(input);
      },
    ),
  infiniteTracks: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100),
        cursor: z.number().nullish(),
        batchId: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { limit, cursor, batchId } = input;

      const startId =
        cursor ?? (await getFirstTrackOfBatchId({ batchId, ctx }));

      const tracks = await ctx.db
        .select()
        .from(recommendationTracks)
        .where(
          and(
            eq(recommendationTracks.batchId, batchId),
            gte(recommendationTracks.id, startId),
          ),
        )
        .orderBy(recommendationTracks.id)
        .limit(limit + 1);

      const hasNextPage = tracks.length > limit;
      const items = hasNextPage ? tracks.slice(0, -1) : tracks;
      const nextCursor = hasNextPage ? items[items.length - 1]!.id + 1 : null;

      return {
        items,
        nextCursor,
      };
    }),
  searchForTracks: protectedProcedure
    .input(RecommendedTrackObjectSchema)
    .query(async ({ input }) => {
      const { track, album, artists, year } = input;

      const queryParts = [];
      if (album) queryParts.push(`album:"${album}"`);
      if (artists) queryParts.push(`artist:"${artists}"`);
      if (track) queryParts.push(`track:"${track}"`);
      if (year) queryParts.push(`year:${year}`);

      const query = queryParts.join(" ");

      console.log(`[searchForTrack query]:`, query);

      const type = "track" as const;

      const result = await spotifyApi.searchForTrack({ q: query, type });

      const firstTrack = result?.tracks?.items?.[0];
      const albumImage = firstTrack?.album?.images?.[0]?.url;
      const trackUri = firstTrack?.uri;

      if (!result || !firstTrack || !albumImage) {
        return null;
      }

      return { trackUri, albumImage };
    }),
  getTrackStatus: protectedProcedure
    .input(
      z.object({
        batchId: z.number(),
        trackId: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { batchId, trackId } = input;

      const trackLocationInTable = and(
        eq(trackPlaylistStatus.batchId, batchId),
        eq(trackPlaylistStatus.trackId, trackId),
      );

      const trackRow = await ctx.db
        .select()
        .from(trackPlaylistStatus)
        .where(trackLocationInTable);

      return trackRow[0];
    }),
});
