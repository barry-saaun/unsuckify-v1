import { api } from "~/trpc/react";
import useRecommendationsWithThreshold from "./useRecommendationsWithThreshold";

type useRecommendedInfTracksParams = {
  playlist_id: string;
  userId: string;
};

export const useRecommendedInfTracks = ({
  playlist_id,
  userId,
}: useRecommendedInfTracksParams) => {
  const {
    data: playlistData,
    isLoading: isLoadingPlaylist,
    error: playlistError,
  } = api.playlist.getPlaylistItemsAll.useQuery(
    {
      playlist_id,
    },
    { staleTime: 86400 * 1000 },
  );

  const {
    data: rec_tracks,
    isLoading: isLoadingRecommendations,
    error: recommendationsError,
  } = useRecommendationsWithThreshold({
    playlistData: playlistData,
  });

  const {
    data: resolvedTracks,
    error: resolvingRecsError,
    isLoading: isLoadingResolvedTracks,
  } = api.track.getOrCreateRecommendations.useQuery(
    {
      userId,
      playlist_id,
      newTracks: rec_tracks!,
    },
    { enabled: !!rec_tracks && !!userId },
  );

  const batchId = resolvedTracks?.batchId;

  const infiniteQueryResult = api.track.infiniteTracks.useInfiniteQuery(
    {
      limit: 2,
      batchId: batchId!,
    },
    { enabled: !!batchId, getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  const isLoading =
    isLoadingPlaylist ||
    isLoadingRecommendations ||
    isLoadingResolvedTracks ||
    infiniteQueryResult.isLoading;
  const error =
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
