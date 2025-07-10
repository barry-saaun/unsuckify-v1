import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { type TRPCCtxType } from "~/server/api/trpc";
import {
  recommendationTracks,
  recommendationBatches,
  trackPlaylistStatus,
  type RecTracksInsertType,
  type TracksStatusInsertType,
} from "~/server/db/schema";
import { tryCatch } from "../try-catch";

export async function deleteExpiredTables({
  ctx,
  batchId,
}: {
  ctx: TRPCCtxType;
  batchId: number;
}) {
  await ctx.db
    .delete(trackPlaylistStatus)
    .where(eq(trackPlaylistStatus.batchId, batchId));
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

export async function insertRecommendedTracks({
  ctx,
  tracksToInsert,
}: {
  ctx: TRPCCtxType;
  tracksToInsert: RecTracksInsertType[];
}) {
  const { data: tracks, error: insertTrackError } = await tryCatch(
    ctx.db.insert(recommendationTracks).values(tracksToInsert).returning(),
  );

  if (insertTrackError) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to insert recommendation tracks.",
      cause: insertTrackError,
    });
  }

  if (!tracks || tracks.length === 0) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "No tracks were inserted.",
    });
  }

  return { tracks };
}

export async function insertTracksStatus({
  ctx,
  tracksStatusToInsert,
}: {
  ctx: TRPCCtxType;
  tracksStatusToInsert: TracksStatusInsertType[];
}) {
  const { error: insertTrackStatusError } = await tryCatch(
    ctx.db.insert(trackPlaylistStatus).values(tracksStatusToInsert),
  );

  if (insertTrackStatusError) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to insert track playlist status.",
      cause: insertTrackStatusError,
    });
  }
}
