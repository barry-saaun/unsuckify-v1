import { api } from "~/trpc/react";
import useRecommendationsWithThreshold from "./useRecommendationsWithThreshold";
import { lsSetPlaylistMetadata } from "~/lib/utils/playlist";
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
  playlistLSExpired,
}: useRecommendedInfTracksParams) => {
  const {
    data: playlistData,
    isLoading: isLoadingPlaylist,
    error: playlistError,
  } = api.playlist.getPlaylistItemsAll.useQuery(
    {
      playlist_id,
    },
    { staleTime: 86400 * 1000, enabled: playlistLSExpired },
  );

  const {
    data: rec_tracks,
    isLoading: isLoadingRecommendations,
    error: recommendationsError,
  } = useRecommendationsWithThreshold({
    playlistData: playlistData,
    playlistLSExpired,
  });

  const {
    data: resolvedTracks,
    error: resolvingRecsError,
    isLoading: isLoadingResolvedTracks,
  } = api.track.getOrCreateRecommendations.useQuery(
    {
      userId,
      playlist_id,
      newTracks: !!rec_tracks ? rec_tracks : undefined,
      playlistLSExpired: playlistLSExpired ?? true,
    },
    { enabled: !!userId },
  );

  useEffect(() => {
    if (resolvedTracks && playlistLSExpired) {
      lsSetPlaylistMetadata(playlist_id);
    }
  }, [resolvedTracks, playlistLSExpired, playlist_id]);

  const batchId = resolvedTracks?.batchId;

  const infiniteQueryResult = api.track.infiniteTracks.useInfiniteQuery(
    {
      limit,
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
