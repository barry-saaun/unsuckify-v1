"use client";
import { useParams, useSearchParams } from "next/navigation";
import ErrorScreen from "~/components/error-screen";
import { useState, useCallback, useEffect } from "react";
import { useInView } from "react-intersection-observer";
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

const TRACK_PER_INF_PAGE = 20;

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
    loadMore,
    coverage,
    isLoading: isLoadingRecs,
    error: recsError,
  } = usePlaylistRecommendations({
    playlist: playlist ?? [],
    enabled:
      !isLoadingPlaylist && !playlistError && (playlist?.length ?? 0) > 0,
    querySettings: {
      limit: 200,
      minScore: 0.6,
    },
  });

  // Intersection observer for infinite scroll
  const { ref: loadMoreTriggerRef, inView } = useInView({
    threshold: 0.2,
    rootMargin: "100px",
  });

  useEffect(() => {
    if (inView && hasNextPage && !isLoadingRecs) {
      loadMore();
    }
  }, [inView, hasNextPage, isLoadingRecs, loadMore]);

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
    <div className="bg-background flex h-full flex-col font-mono">
      {/* Page header */}
      <div className="border-border flex items-center justify-between border-b px-6 py-3">
        <span className="text-muted-foreground text-xs tracking-widest uppercase">
          / Recommendations
        </span>
        {/* {coverage && ( */}
        {/*   <span className="text-muted-foreground text-xs tracking-widest uppercase"> */}
        {/*     {coverage.embedded}/{coverage.total} matched */}
        {/*   </span> */}
        {/* )} */}
      </div>

      {/* Mode switcher — only for owned playlists */}
      {isOwned && (
        <div className="border-border flex border-b">
          {/* Left mode tab */}
          <button
            onClick={() => handleModeSwitch("add")}
            className={`border-border flex-1 border-r py-2.5 text-[9px] font-bold tracking-[0.25em] uppercase transition-colors ${
              ownedMode === "add"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            + Add to this playlist
          </button>
          {/* Right mode tab */}
          <button
            onClick={() => handleModeSwitch("new")}
            className={`flex-1 py-2.5 text-[9px] font-bold tracking-[0.25em] uppercase transition-colors ${
              ownedMode === "new"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            ■ Create new playlist
          </button>
        </div>
      )}

      {/* Info banner */}
      <div className="border-border border-b px-6 py-0">
        <InfoBanner isOwned={isOwned} ownedMode={ownedMode} />
      </div>

      {/* Track grid */}
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        {playlistName && (
          <h1 className="text-foreground mb-6 text-center text-3xl font-bold tracking-tight uppercase">
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
          {/* Loading indicator */}
          {isLoadingRecs && hasNextPage && (
            <>
              {Array.from(
                { length: TRACK_PER_INF_PAGE },
                (_item, itemIndex) => (
                  <RecommendedTrackCardSkeleton
                    isOwned={isOwned}
                    key={`skeleton-${itemIndex}`}
                  />
                ),
              )}
            </>
          )}
          {/* Invisible trigger element for intersection observer */}
          {hasNextPage && (
            <div ref={loadMoreTriggerRef} className="col-span-full h-1" />
          )}
        </div>

        {!hasNextPage && (
          <>
            <div className="mt-5 flex w-full items-center justify-center border border-black px-4 py-3 font-mono dark:border-white">
              <p className="flex text-center text-xs font-bold tracking-wide text-black uppercase dark:text-white">
                — End of Recommendations —
              </p>
            </div>
          </>
        )}
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
    </div>
  );
}
