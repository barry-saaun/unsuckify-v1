import { api } from "~/trpc/react";
import useRecommendationsWithThreshold from "./useRecommendationsWithThreshold";

type useRecommendedInfTracksParams = {
  playlist_id: string;
  userId: string;
  limit: number;
};

export const useRecommendedInfTracks = ({
  playlist_id,
  userId,
  limit,
}: useRecommendedInfTracksParams) => {
  const {
    data: latestBatch,
    isLoading: isLoadingLatestBatch,
    error: latestBatchError,
  } = api.track.getLatestBatch.useQuery({
    playlist_id,
    userId,
  });

  let within24hours = false;

  if (latestBatch) {
    const now = new Date();
    const generatedAt = latestBatch.generatedAt;
    const msSince = now.getTime() - generatedAt.getTime();
    const ms24h = 24 * 60 * 60 * 1000;

    within24hours = msSince < ms24h;
  }

  console.log("is in 24 hours:", within24hours);
  const shouldFetch = latestBatch !== undefined && !within24hours;

  console.log("should fetch new batch: ", shouldFetch);

  const {
    data: playlistData,
    isLoading: isLoadingPlaylist,
    error: playlistError,
  } = api.playlist.getPlaylistItemsAll.useQuery(
    {
      playlist_id,
    },
    { staleTime: 86400 * 1000, enabled: shouldFetch },
  );

  const {
    data: rec_tracks,
    isLoading: isLoadingRecommendations,
    error: recommendationsError,
  } = useRecommendationsWithThreshold({
    playlistData: playlistData,
    enabledWhen: shouldFetch,
  });

  const {
    data: resolvedTracks,
    error: resolvingRecsError,
    isLoading: isLoadingResolvedTracks,
  } = api.track.getOrCreateRecommendations.useQuery(
    {
      userId,
      playlist_id,
      newTracks: rec_tracks ?? undefined,
      latestBatchInput: latestBatch,
    },
    { enabled: !!userId },
  );

  const batchId = resolvedTracks?.batchId;

  const infiniteQueryResult = api.track.infiniteTracks.useInfiniteQuery(
    {
      limit,
      batchId: batchId!,
    },
    { enabled: !!batchId, getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  const isLoading =
    isLoadingLatestBatch ||
    isLoadingPlaylist ||
    isLoadingRecommendations ||
    isLoadingResolvedTracks ||
    infiniteQueryResult.isLoading;
  const error =
    latestBatchError ??
    playlistError ??
    recommendationsError ??
    resolvingRecsError ??
    infiniteQueryResult.error;

  return {
    ...infiniteQueryResult,
    isLoadingAny: isLoading,
    errorAny: error,
    playlistData,
    rec_tracks,
  };
};
