import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { RecommendedTracksSchema } from "~/types";
import { systemPrompt } from "~/constants/system-prompt";
import SuperJSON from "superjson";
import {
  recommendationBatches,
  recommendationTracks,
  users,
} from "~/server/db/schema";

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

      return object;
    }),

  pushRecommendations: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        playlistId: z.string(),
        recommendations: RecommendedTracksSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .insert(users)
        .values({ id: input.userId })
        .onConflictDoNothing();

      const [batch] = await ctx.db
        .insert(recommendationBatches)
        .values({
          userId: input.userId,
          playlistId: input.playlistId,
          generatedAt: new Date(),
        })
        .returning();

      const tracksToInsert = input.recommendations.map((rec) => ({
        trackName: rec.track,
        albumName: rec.album,
        artistsName: rec.artist,
        batchId: batch?.id,
      }));

      await ctx.db.insert(recommendationTracks).values(tracksToInsert);
      return { success: true, batchId: batch!.id };
    }),
});
