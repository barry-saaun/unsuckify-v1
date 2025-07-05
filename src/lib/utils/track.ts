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
