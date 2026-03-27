import { useState, useCallback, useRef, useEffect } from "react";
import { api } from "~/trpc/react";
import { type RawTrack } from "~/lib/music/types";

const PAGE_SIZE = 20;

interface usePlaylistRecommendationsParams {
  playlist: RawTrack[];
  querySettings: {
    limit: number;
    minScore: number;
  };
  enabled?: boolean;
}

export function usePlaylistRecommendations({
  playlist,
  querySettings,
  enabled,
}: usePlaylistRecommendationsParams) {
  const [displayedCount, setDisplayedCount] = useState(PAGE_SIZE);
  const prevPlaylistRef = useRef<RawTrack[]>([]);

  const isEnabled = (enabled ?? true) && playlist.length > 0;

  const {
    data,
    isLoading: isQueryLoading,
    error,
  } = api.recommendations.getForPlaylist.useQuery(
    {
      playlist,
      limit: querySettings.limit,
      minScore: querySettings.minScore,
    },
    {
      enabled: isEnabled,
      staleTime: Infinity,
    },
  );

  // Reset displayedCount when playlist changes
  useEffect(() => {
    if (playlist !== prevPlaylistRef.current) {
      setDisplayedCount(PAGE_SIZE);
      prevPlaylistRef.current = playlist;
    }
  }, [playlist]);

  const isLoading = isEnabled && isQueryLoading;

  const allRecs = data?.recommendations ?? [];
  const coverage = data?.meta.coverage ?? undefined;

  const visibleRecs = allRecs.slice(0, displayedCount);
  const hasNextPage = displayedCount < allRecs.length;

  const loadMore = useCallback(() => {
    setDisplayedCount((prev) => prev + PAGE_SIZE);
  }, []);

  return {
    visibleRecs,
    allRecs,
    hasNextPage,
    loadMore,
    coverage,
    isLoading,
    error,
  };
}
