import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { recommendationTracks } from "~/server/db/schema";
import { api } from "~/trpc/server";
import type { TRecommendedTracks } from "~/types";

type HandleRecommendationsTracksArgs = {
  userId: string;
  playlist_id: string;
  newTracks: TRecommendedTracks;
};

type HandleReccomendationsTracksReturn = {
  resolvedTracks: TRecommendedTracks;
  timeLeft: number | null;
};

export async function handleRecommendationsTracks({
  userId,
  playlist_id,
  newTracks,
}: HandleRecommendationsTracksArgs): Promise<HandleReccomendationsTracksReturn> {
  const latestBatch = await api.track.getLatestBatch({
    userId,
    playlist_id,
    newTracks,
  });

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
    }
  }

  if (within24hours && batchId) {
    const resolvedTracks = await db
      .select()
      .from(recommendationTracks)
      .where(eq(recommendationTracks.batchId, batchId));

    return { resolvedTracks, timeLeft };
  } else {
    const { success } = await api.track.pushRecommendations({
      userId,
      playlist_id,
      recommendations: newTracks,
    });

    if (!success)
      return { resolvedTracks: newTracks, timeLeft: new Date().getTime() };
  }

  return { resolvedTracks: newTracks, timeLeft: null };
}
