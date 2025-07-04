import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import {
  RecommendedTracksSchema,
  type HandleReccomendationsTracksReturn,
} from "~/types";
import { systemPrompt } from "~/constants/system-prompt";
import SuperJSON from "superjson";
import {
  recommendationBatches,
  recommendationTracks,
} from "~/server/db/schema";
import { and, eq } from "drizzle-orm";
import { ensureUserExistence } from "~/lib/utils/user";
import { TRPCError } from "@trpc/server";
import { tryCatch } from "~/lib/try-catch";
import { deleteExpiredBatchAndTracks } from "~/lib/utils/track";

export const trackRouter = createTRPCRouter({
  getRecommendations: protectedProcedure
    .input(z.array(z.string()))
    .query(async ({ input }) => {
      const { object } = await generateObject({
        model: google("gemini-2.0-flash-exp"),
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
        batchId: batch?.id,
      }));

      const { error } = await tryCatch(
        ctx.db.insert(recommendationTracks).values(tracksToInsert),
      );

      if (error) {
        console.error(
          "Database error during recommendationTracks insertion:",
          error,
        ); // <-- LOG THE ERROR
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to insert recommendation tracks.",
          cause: error, // Useful for server-side
        });
      }

      // await ctx.db.insert(recommendationTracks).values(tracksToInsert);
      return { success: true, batchId: batch.id };
    }),

  getLatestBatch: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        playlist_id: z.string(),
        newTracks: RecommendedTracksSchema,
      }),
    )
    .query(async ({ ctx, input }) => {
      const latestBatch = await ctx.db
        .select()
        .from(recommendationBatches)
        .where(
          and(
            eq(recommendationBatches.userId, input.userId),
            eq(recommendationBatches.playlistId, input.playlist_id),
          ),
        )
        .then((rows) => rows[0]);

      return latestBatch;
    }),
  getOrCreateRecommendations: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        playlist_id: z.string(),
        newTracks: RecommendedTracksSchema,
      }),
    )
    .query(
      async ({ ctx, input }): Promise<HandleReccomendationsTracksReturn> => {
        const caller = trackRouter.createCaller(ctx);
        const latestBatch = await caller.getLatestBatch(input);

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
            await deleteExpiredBatchAndTracks({ ctx, batchId });
          }
        }

        if (within24hours && batchId) {
          console.log(`Attempting to select tracks for batchId: ${batchId}`); // <-- Add this
          const resolvedTracks = await ctx.db
            .select()
            .from(recommendationTracks)
            .where(eq(recommendationTracks.batchId, batchId));

          return {
            resolvedTracks: resolvedTracks.map((track) => ({
              track: track.track,
              album: track.album,
              artists: track.artists,
            })),
            timeLeft,
          };
        } else {
          const { success } = await caller.pushRecommendations({
            userId: input.userId,
            playlist_id: input.playlist_id,
            recommendations: input.newTracks,
          });

          if (!success) {
            return {
              resolvedTracks: input.newTracks,
              timeLeft: new Date().getTime(),
            };
          }

          return { resolvedTracks: input.newTracks, timeLeft: null };
        }
      },
    ),
});
