import type { QueryFunctionContext } from "@tanstack/react-query";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { type TRPCCtxType } from "~/server/api/trpc";
import {
  recommendationTracks,
  recommendationBatches,
} from "~/server/db/schema";

export async function deleteExpiredBatchAndTracks({
  ctx,
  batchId,
}: {
  ctx: TRPCCtxType;
  batchId: number;
}) {
  await ctx.db
    .delete(recommendationTracks)
    .where(eq(recommendationTracks.batchId, batchId));

  await ctx.db
    .delete(recommendationBatches)
    .where(eq(recommendationBatches.id, batchId));
}

export async function getFirstTrackOfBatchId({
  ctx,
  batchId,
}: {
  ctx: TRPCCtxType;
  batchId: number;
}) {
  const firstTrack = await ctx.db
    .select()
    .from(recommendationTracks)
    .where(eq(recommendationTracks.batchId, batchId))
    .orderBy(recommendationTracks.id)
    .then((rows) => rows[0]);

  if (!firstTrack) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not retrieve the first track of the batch",
    });
  }

  return firstTrack.id;
}
