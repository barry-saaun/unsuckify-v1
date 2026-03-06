"use client";
import { useParams, useSearchParams } from "next/navigation";
import ErrorScreen from "~/components/error-screen";
import { useState } from "react";
import LoadingMessages from "~/components/loading-messages";
import InfoBanner from "~/components/info-banner";
import RecommendedTrackCardSkeleton from "~/components/rec-track-card-skeleton";
import { useUserContext } from "~/components/user-context-provider";
import { api } from "~/trpc/react";
import { usePlaylistRecommendations } from "~/hooks/usePlaylistRecommendations";
import type { SimilarSong } from "~/lib/pinecone/find-similar-songs";
import RecommendedTrackCard from "~/components/recommended-track-card";

const TRACK_PER_INF_PAGE = 6;

export default function PlaylistContent() {
  const params = useParams<{ playlist_id: string }>();
  const searchParams = useSearchParams();
  const { userId } = useUserContext();

  const ownerId = searchParams.get("ownerId");
  const playlistName = searchParams.get("playlistName");
  const isOwned = ownerId === userId;
  const playlist_id = params.playlist_id;

  const [selectedSongs, setSelectedSongs] = useState(new Set<string>());
  const [skeletonPages] = useState(0);

  const {
    data: playlist,
    isLoading: isLoadingPlaylist,
    error: playlistError,
  } = api.playlist.getPlaylistItemsAll.useQuery({
    playlist_id: playlist_id ?? "",
  });

  const {
    visibleRecs,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    page,
    totalPages,
    coverage,
    isLoading: isLoadingRecs,
    error: recsError,
  } = usePlaylistRecommendations({
    playlist: playlist ?? [],
    enabled:
      !isLoadingPlaylist && !playlistError && (playlist?.length ?? 0) > 0,
    querySettings: {
      limit: 50,
      minScore: 0.6,
    },
  });

  const handleCardSelect = (song: SimilarSong) => {
    setSelectedSongs((prev) => {
      const next = new Set(prev);
      if (next.has(song.songKey)) {
        next.delete(song.songKey);
      } else {
        next.add(song.songKey);
      }
      return next;
    });
  };

  if (!playlist_id) return <ErrorScreen message="Invalid Playlist ID." />;
  if (!userId)
    return <ErrorScreen message="Sorry! We could not get your Spotify ID." />;
  if (playlistError) return <ErrorScreen message={playlistError.message} />;
  if (recsError) return <ErrorScreen message={recsError.message} />;

  if (!playlistError && (!playlist || isLoadingPlaylist || isLoadingRecs)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6">
        <div className="hungry-loader" />
        <LoadingMessages interval={2500} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white font-mono dark:bg-black">
      {/* Page header */}
      <div className="flex items-center justify-between border-b border-black px-6 py-3 dark:border-white">
        <span className="text-xs tracking-widest text-black/40 uppercase dark:text-white/40">
          / Recommendations
        </span>
        {coverage && (
          <span className="text-xs tracking-widest text-black/40 uppercase dark:text-white/40">
            {coverage.embedded}/{coverage.total} matched
          </span>
        )}
      </div>

      {/* Info banner */}
      <div className="border-b border-black px-6 py-0 dark:border-white">
        <InfoBanner isOwned={isOwned} />
      </div>

      {/* Track grid */}
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        {playlistName && (
          <h1 className="mb-6 text-center text-3xl font-bold tracking-tight text-black uppercase dark:text-white">
            {playlistName}
          </h1>
        )}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {visibleRecs.map((song: SimilarSong) => (
            <RecommendedTrackCard
              key={song.songKey}
              song={song}
              isOwned={isOwned}
              isSelected={selectedSongs.has(song.songKey)}
              onSelectAction={handleCardSelect}
            />
          ))}
          {Array.from({ length: skeletonPages }, (_page, pageIndex) =>
            Array.from({ length: TRACK_PER_INF_PAGE }, (_item, itemIndex) => (
              <RecommendedTrackCardSkeleton
                isOwned={isOwned}
                key={`skeleton-${pageIndex}-${itemIndex}`}
              />
            )),
          )}
        </div>
      </div>

      {/* Pagination */}
      {(hasNextPage || hasPrevPage) && (
        <div className="flex items-center border-t border-black dark:border-white">
          <button
            onClick={prevPage}
            disabled={!hasPrevPage}
            className="flex-1 border-r border-black py-4 text-xs font-bold tracking-widest text-black uppercase transition-opacity hover:opacity-60 disabled:opacity-20 dark:border-white dark:text-white"
          >
            ← Previous
          </button>
          <span className="px-6 text-xs tracking-widest text-black/40 uppercase dark:text-white/40">
            {page} / {totalPages}
          </span>
          <button
            onClick={nextPage}
            disabled={!hasNextPage}
            className="flex-1 border-l border-black py-4 text-xs font-bold tracking-widest text-black uppercase transition-opacity hover:opacity-60 disabled:opacity-20 dark:border-white dark:text-white"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
