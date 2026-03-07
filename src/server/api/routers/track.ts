import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { generateText, Output } from "ai";
import {
  RecommendedTrackObjectSchema,
  RecommendedTracksSchema,
  type TRecommendedTracks,
} from "~/types";
import { systemPrompt } from "~/constants/system-prompt";
import SuperJSON from "superjson";
import {
  recommendationBatches,
  recommendationTracks,
  trackPlaylistStatus,
} from "~/server/db/schema";
import { and, eq, gte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getFirstTrackOfBatchId } from "~/lib/utils/track";
import { spotifyApi } from "~/lib/music/spotify";
import { openRouterApi } from "~/lib/openrouter";
import { lastFmApi } from "~/lib/music/lastfm";
import { tryCatch } from "~/lib/utils/try-catch";
import { getRecommendations } from "~/lib/pinecone/get-recommendations";

const UNKNOWN_ALBUM = "Unknown";

const PlaylistSongSchema = z.object({
  artist: z.string().min(1),
  track: z.string().min(1),
});

export const trackRouter = createTRPCRouter({
  getRecommendationsV2: protectedProcedure
    .input(
      z.object({
        playlist: z.array(PlaylistSongSchema).min(1).max(300),
        limit: z.number().min(1).max(50).default(20),
        minScore: z.number().min(0).max(1).default(0.6),
      }),
    )
    .query(async ({ input }) => {
      const { data, error } = await tryCatch(getRecommendations(input));

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to generate recommendations",
          cause: error,
        });
      }

      return data;
    }),
  getTrackInfo: protectedProcedure
    .input(z.object({ artist: z.string(), track: z.string() }))
    .query(async ({ input }) => {
      const trackInfo = await lastFmApi.getTrackInfo({
        artist: input.artist,
        track: input.track,
      });

      if (trackInfo && typeof trackInfo === "object") {
        return trackInfo;
      }

      return "Error";
    }),
  getRecommendations: protectedProcedure
    .input(z.array(z.string()))
    .query(async ({ input }) => {
      try {
        const { output } = await generateText({
          model: openRouterApi.getChatModel("openai/gpt-5-mini"),
          output: Output.object({
            schema: z.object({
              recommendations: RecommendedTracksSchema,
            }),
            name: "Recommendations",
          }),
          system: systemPrompt,
          prompt: SuperJSON.stringify(input),
        });

        console.log(
          "[model] ",
          String(openRouterApi.getChatModel("openai/gpt-5-mini")),
        );

        if (!output || !output.recommendations) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Failed to generate recommendations.\nThe AI model did not return valid recommendations.",
          });
        }

        return output.recommendations;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `AI Provider error: ${errorMessage || "Failed to generate recommendations"}`,
          cause: error,
        });
      }
    }),
  getRecommendationsMutate: protectedProcedure
    .input(z.array(z.string()))
    .mutation(async ({ input, ctx }): Promise<TRecommendedTracks> => {
      const caller = trackRouter.createCaller(ctx);
      return await caller.getRecommendations(input);
    }),

  // pushRecommendations: protectedProcedure
  //   .input(
  //     z.object({
  //       userId: z.string(),
  //       playlist_id: z.string(),
  //       recommendations: RecommendedTracksSchema,
  //     }),
  //   )
  //   .mutation(async ({ input, ctx }) => {
  //     await ensureUserExistence({ input, ctx });
  //
  //     const [batch] = await ctx.db
  //       .insert(recommendationBatches)
  //       .values({
  //         userId: input.userId,
  //         playlistId: input.playlist_id,
  //         generatedAt: new Date(),
  //       })
  //       .returning();
  //
  //     if (!batch) {
  //       throw new TRPCError({
  //         code: "INTERNAL_SERVER_ERROR",
  //         message: "Failed to create recommendation batch.",
  //       });
  //     }
  //
  //     const tracksToInsert = input.recommendations.map((rec) => ({
  //       track: rec.track,
  //       album: rec.album,
  //       artists: rec.artists,
  //       year: rec.year,
  //       batchId: batch?.id,
  //     }));
  //
  //     const { tracks } = await insertRecommendedTracks({ ctx, tracksToInsert });
  //
  //     const tracksStatusToInsert: TracksStatusInsertType[] = tracks.map(
  //       (track) => ({
  //         batchId: track.batchId,
  //         trackId: track.id,
  //       }),
  //     );
  //
  //     await insertTracksStatus({ ctx, tracksStatusToInsert });
  //
  //     // await ctx.db.insert(recommendationTracks).values(tracksToInsert);
  //     return { success: true, batchId: batch.id };
  //   }),

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
  // getOrCreateRecommendations: protectedProcedure
  //   .input(GetOrCreateRecommendationsSchema)
  //   .query(
  //     async ({ ctx, input }): Promise<HandleRecommendationTracksReturn> => {
  //       const { latestBatchInput } = input;
  //       console.log("latestbatchinput:", latestBatchInput);
  //
  //       const caller = trackRouter.createCaller(ctx);
  //       const latestBatch =
  //         latestBatchInput ?? (await caller.getLatestBatch(input));
  //
  //       const now = new Date();
  //       let within24hours = false;
  //       let batchId = null;
  //       let timeLeft: number | null = null;
  //
  //       if (latestBatch) {
  //         batchId = latestBatch.id;
  //         const generatedAt = latestBatch.generatedAt;
  //         const msSince = now.getTime() - generatedAt.getTime();
  //         const ms24h = 24 * 60 * 60 * 1000;
  //
  //         within24hours = msSince < ms24h;
  //         if (within24hours) {
  //           timeLeft = ms24h - msSince;
  //         } else {
  //           await deleteExpiredTables({ ctx, batchId });
  //         }
  //       }
  //
  //       console.log("[track]: batchId", batchId);
  //
  //       // Case 1: Data exists and is fresh (not expired)
  //       if (within24hours && batchId) {
  //         console.log(`Attempting to select tracks for batchId: ${batchId}`);
  //         const resolvedTracks = await ctx.db
  //           .select()
  //           .from(recommendationTracks)
  //           .where(eq(recommendationTracks.batchId, batchId));
  //
  //         return {
  //           resolvedTracks: resolvedTracks.map((track) => ({
  //             track: track.track,
  //             album: track.album,
  //             artists: track.artists,
  //             year: track.year,
  //           })),
  //           timeLeft,
  //           batchId,
  //           success: true,
  //         };
  //       }
  //
  //       console.log("[track]: input new track", input.newTracks);
  //
  //       // gracefully handle the case where it's undefined
  //       if (!input.newTracks) {
  //         return {
  //           resolvedTracks: [],
  //           timeLeft: null,
  //           success: false,
  //           batchId: null,
  //         };
  //       }
  //
  //       const result = await caller.pushRecommendations({
  //         userId: input.userId,
  //         playlist_id: input.playlist_id,
  //         recommendations: input.newTracks,
  //       });
  //
  //       console.log("[pushRec]: is called");
  //
  //       if (!result.success) {
  //         console.log("log from !success");
  //         return {
  //           resolvedTracks: [],
  //           timeLeft: new Date().getTime(),
  //           success: false,
  //           batchId: null,
  //         };
  //       }
  //       batchId = result.batchId;
  //       timeLeft = 24 * 60 * 60 * 1000;
  //
  //       return {
  //         resolvedTracks: input.newTracks,
  //         timeLeft,
  //         success: true,
  //         batchId,
  //       };
  //     },
  //   ),
  //
  // getOrCreateRecommendationsMutate: protectedProcedure
  //   .input(GetOrCreateRecommendationsSchema)
  //   .mutation(
  //     async ({ ctx, input }): Promise<HandleRecommendationTracksReturn> => {
  //       const caller = trackRouter.createCaller(ctx);
  //       return await caller.getOrCreateRecommendations(input);
  //     },
  //   ),
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
