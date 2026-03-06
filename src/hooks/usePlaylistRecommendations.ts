import { useState } from "react";
import { api } from "~/trpc/react";
import { type RawTrack } from "~/lib/music/types";

const PAGE_SIZE = 9;

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
  const [page, setPage] = useState(1);

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

  const isLoading = isEnabled && isQueryLoading;

  const allRecs = data?.recommendations ?? [];
  const coverage = data?.playlistCoverage ?? undefined;

  const visibleRecs = allRecs.slice(0, page * PAGE_SIZE);

  const hasNextPage = visibleRecs.length < allRecs.length;

  const nextPage = () => setPage((p) => p + 1);
  const prevPage = () => setPage((p) => Math.min(1, p - 1));

  const hasPrevPage = page > 1;

  return {
    visibleRecs,
    allRecs,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    page,
    totalPages: Math.ceil(allRecs.length / PAGE_SIZE),
    coverage,
    isLoading,
    error,
  };
}
