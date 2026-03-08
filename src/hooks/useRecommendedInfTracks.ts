import { api } from "~/trpc/react";
import useRecommendationsWithThreshold from "./useRecommendationsWithThreshold";
import { useEffect } from "react";

type useRecommendedInfTracksParams = {
  playlist_id: string;
  userId: string;
  limit: number;
  playlistLSExpired?: boolean;
};

export const useRecommendedInfTracks = ({
  playlist_id,
  userId,
  limit,
}: useRecommendedInfTracksParams) => {
  const missingParams = !userId || !playlist_id;
  const {
    data: latestBatch,
    isLoading: isLoadingLatestBatch,
    error: latestBatchError,
  } = api.track.getLatestBatch.useQuery(
    { playlist_id, userId },
    { enabled: !missingParams },
  );

  let within24hours = false;

  if (latestBatch) {
    const now = new Date();
    const generatedAt = latestBatch.generatedAt;
    const msSince = now.getTime() - generatedAt.getTime();
    const ms24h = 24 * 60 * 60 * 1000;

    within24hours = msSince < ms24h;
  }

  // console.log("is in 24 hours:", within24hours);
  const shouldFetch = latestBatch !== undefined && !within24hours;

  // console.log("should fetch new batch: ", shouldFetch);

  const {
    data: playlistData,
    isLoading: isLoadingPlaylist,
    error: playlistError,
  } = api.playlist.getPlaylistItemsAll.useQuery(
    {
      playlist_id,
    },
    { staleTime: 86400 * 1000, enabled: shouldFetch && !missingParams },
  );

  const {
    data: rec_tracks,
    isLoading: isLoadingRecommendations,
    error: recommendationsError,
  } = useRecommendationsWithThreshold({
    playlistData: playlistData,
    enabledWhen: shouldFetch && !missingParams,
  });

  // console.log("rec_tracks:", rec_tracks);

  const getOrCreateMutation =
    api.track.getOrCreateRecommendationsMutate.useMutation();
  const {
    mutate,
    data: resolvedTracks,
    isPending: isPendingResolvedTracks,
    error: resolvingRecsError,
  } = getOrCreateMutation;

  useEffect(() => {
    const hasRequiredData =
      (!shouldFetch || (playlistData && rec_tracks)) && !missingParams;
    if (
      getOrCreateMutation &&
      userId &&
      getOrCreateMutation.status === "idle" &&
      !isLoadingRecommendations &&
      !isLoadingLatestBatch &&
      !isLoadingPlaylist &&
      hasRequiredData
    ) {
      console.log("About to mutate with:", {
        playlist_id,
        userId,
        newTracks: rec_tracks ?? undefined,
        latestBatchInput: latestBatch,
      });
      mutate({
        playlist_id,
        userId,
        newTracks: rec_tracks ?? undefined,
        latestBatchInput: latestBatch,
      });
    }
  }, [
    latestBatch,
    getOrCreateMutation,
    missingParams,
    playlist_id,
    userId,
    rec_tracks,
    mutate,
    isLoadingRecommendations,
    isLoadingLatestBatch,
    isLoadingPlaylist,
    shouldFetch,
    playlistData,
  ]);

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
    isPendingResolvedTracks ||
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
