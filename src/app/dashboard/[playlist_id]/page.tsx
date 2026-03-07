"use client";
import { useParams, useSearchParams } from "next/navigation";
import ErrorScreen from "~/components/error-screen";
import { useState, useCallback } from "react";
import LoadingMessages from "~/components/loading-messages";
import InfoBanner from "~/components/info-banner";
import RecommendedTrackCardSkeleton from "~/components/rec-track-card-skeleton";
import { useUserContext } from "~/components/user-context-provider";
import { api } from "~/trpc/react";
import { usePlaylistRecommendations } from "~/hooks/usePlaylistRecommendations";
import { useResolvedTracks } from "~/hooks/useResolvedTracks";
import type { SimilarSong } from "~/lib/pinecone/find-similar-songs";
import RecommendedTrackCard, {
  type AddStatus,
} from "~/components/recommended-track-card";
import CreateNewPlaylistCard from "~/components/create-new-playlist-card";

type TrackAddState = {
  status: AddStatus;
  snapshotId?: string;
};

const TRACK_PER_INF_PAGE = 6;

type OwnedMode = "add" | "new";

export default function PlaylistContent() {
  const params = useParams<{ playlist_id: string }>();
  const searchParams = useSearchParams();
  const { userId } = useUserContext();

  const ownerId = searchParams.get("ownerId");
  const playlistName = searchParams.get("playlistName");
  const isOwned = ownerId === userId;
  const playlist_id = params.playlist_id;

  // Mode only relevant when `isOwned === true`
  const [ownedMode, setOwnedMode] = useState<OwnedMode>("add");

  // Selected track URIs for "new playlist" flow
  const [selectedTrackUris, setSelectedTrackUris] = useState(new Set<string>());
  const [skeletonPages] = useState(0);

  // Per-card state for "add to playlist" flow: status + snapshot_id for undo
  const [addStateMap, setAddStateMap] = useState(
    new Map<string, TrackAddState>(),
  );

  const addTracksToPlaylistMutation =
    api.playlist.addItemsToPlaylist.useMutation();

  const removePlaylistItemsMutation =
    api.playlist.removePlaylistItems.useMutation();

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
      limit: 80,
      minScore: 0.6,
    },
  });

  // Resolve Spotify data (trackUri + albumImage) for all visible recs in the parent
  const { resolvedMap, loadingMap } = useResolvedTracks(visibleRecs);

  // ── "New playlist" mode handlers ─────────────────────────────────────────
  const handleCardSelect = (_song: SimilarSong, trackUri: string) => {
    setSelectedTrackUris((prev) => {
      const next = new Set(prev);
      if (next.has(trackUri)) {
        next.delete(trackUri);
      } else {
        next.add(trackUri);
      }
      return next;
    });
  };

  const setTrackState = useCallback(
    (trackUri: string, patch: Partial<TrackAddState>) => {
      setAddStateMap((prev) => {
        const next = new Map(prev);
        next.set(trackUri, {
          ...(prev.get(trackUri) ?? { status: "idle" }),
          ...patch,
        });
        return next;
      });
    },
    [],
  );

  // ── "Add to playlist" mode handlers ──────────────────────────────────────
  const handleCardAdd = useCallback(
    async (_song: SimilarSong, trackUri: string) => {
      if (!playlist_id) return;

      setTrackState(trackUri, { status: "adding" });

      try {
        const result = await addTracksToPlaylistMutation.mutateAsync({
          playlist_id,
          params: { track_uris: [trackUri] },
        });
        setTrackState(trackUri, {
          status: "added",
          snapshotId: result.snapshot_id ?? undefined,
        });
      } catch {
        setTrackState(trackUri, { status: "error" });
      }
    },
    [playlist_id, addTracksToPlaylistMutation, setTrackState],
  );

  // ── "Undo add" handler — remove the just-added track ──────────────────────
  const handleCardUndo = useCallback(
    async (_song: SimilarSong, trackUri: string) => {
      if (!playlist_id) return;
      const snapshotId = addStateMap.get(trackUri)?.snapshotId;
      if (!snapshotId) return;

      setTrackState(trackUri, { status: "removing" });

      try {
        await removePlaylistItemsMutation.mutateAsync({
          playlist_id,
          params: { uri: trackUri, snapshot_id: snapshotId },
        });
        setTrackState(trackUri, { status: "idle", snapshotId: undefined });
      } catch {
        // On undo failure, keep the card in "added" state so the user can retry
        setTrackState(trackUri, { status: "added" });
      }
    },
    [playlist_id, addStateMap, removePlaylistItemsMutation, setTrackState],
  );

  // When switching modes, clear the relevant state so the UI resets cleanly
  const handleModeSwitch = (mode: OwnedMode) => {
    setOwnedMode(mode);
    if (mode === "add") {
      setSelectedTrackUris(new Set());
    } else {
      setAddStateMap(new Map());
    }
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

  const selectedUrisList = Array.from(selectedTrackUris);

  // "new" mode panel: slide in when tracks are selected
  const showNewPlaylistPanel =
    isOwned && ownedMode === "new" && selectedUrisList.length > 0;
  // "add" mode panel: not needed — adds are fire-and-forget per card
  // For !isOwned, same "new playlist" panel but always active once any track selected
  const showNotOwnedPanel = !isOwned && selectedUrisList.length > 0;

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

      {/* Mode switcher — only for owned playlists */}
      {isOwned && (
        <div className="flex border-b border-black dark:border-white">
          {/* Left mode tab */}
          <button
            onClick={() => handleModeSwitch("add")}
            className={`flex-1 border-r border-black py-2.5 text-[9px] font-bold tracking-[0.25em] uppercase transition-colors dark:border-white ${
              ownedMode === "add"
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white"
            }`}
          >
            + Add to this playlist
          </button>
          {/* Right mode tab */}
          <button
            onClick={() => handleModeSwitch("new")}
            className={`flex-1 py-2.5 text-[9px] font-bold tracking-[0.25em] uppercase transition-colors ${
              ownedMode === "new"
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white"
            }`}
          >
            ■ Create new playlist
          </button>
        </div>
      )}

      {/* Info banner */}
      <div className="border-b border-black px-6 py-0 dark:border-white">
        <InfoBanner isOwned={isOwned} ownedMode={ownedMode} />
      </div>

      {/* Track grid */}
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        {playlistName && (
          <h1 className="mb-6 text-center text-3xl font-bold tracking-tight text-black uppercase dark:text-white">
            {playlistName}
          </h1>
        )}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {visibleRecs.map((song: SimilarSong) => {
            const resolved = resolvedMap.get(song.songKey);
            const isLoading = loadingMap.get(song.songKey) ?? true;
            const trackUri = resolved?.trackUri;
            return (
              <RecommendedTrackCard
                key={song.songKey}
                song={song}
                isOwned={isOwned}
                resolvedTrack={resolved ?? null}
                trackLoading={isLoading}
                isSelected={!!trackUri && selectedTrackUris.has(trackUri)}
                onSelectAction={handleCardSelect}
                ownedMode={ownedMode}
                addStatus={
                  trackUri
                    ? (addStateMap.get(trackUri)?.status ?? "idle")
                    : "idle"
                }
                onAddAction={handleCardAdd}
                onUndoAction={handleCardUndo}
              />
            );
          })}
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

      {/* Create playlist panel — slides in when tracks are selected */}
      {(showNewPlaylistPanel || showNotOwnedPanel) && (
        <div
          className={`transition-all duration-300 ease-in-out ${
            showNewPlaylistPanel || showNotOwnedPanel
              ? "max-h-56 pt-2 opacity-100"
              : "max-h-0 overflow-hidden opacity-0"
          }`}
        >
          <CreateNewPlaylistCard
            selectedTracksUri={selectedUrisList}
            user_id={userId}
            onDismiss={() => setSelectedTrackUris(new Set())}
          />
        </div>
      )}

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
