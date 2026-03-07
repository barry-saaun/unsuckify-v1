"use client";
import type { SimilarSong } from "~/lib/pinecone/find-similar-songs";
import type { ResolvedTrack } from "~/hooks/useResolvedTracks";
import Image from "next/image";
import ImagePlaceholder from "./image-placeholder";

export type AddStatus = "idle" | "adding" | "added" | "removing" | "error";

type RecommendedTrackCardProps = {
  song: SimilarSong;
  isOwned: boolean;
  /** Resolved Spotify data passed from the parent. null = still loading. */
  resolvedTrack: ResolvedTrack | undefined;
  trackLoading: boolean;
  onSelectAction?: (song: SimilarSong, trackUri: string) => void;
  isSelected?: boolean;
  /** isOwned only — current mode */
  ownedMode?: "add" | "new";
  /** isOwned + add mode — per-card state driven by parent */
  addStatus?: AddStatus;
  /** isOwned + add mode — fires when user clicks the card to add */
  onAddAction?: (song: SimilarSong, trackUri: string) => void;
  /** isOwned + add mode — fires when user clicks undo on an added card */
  onUndoAction?: (song: SimilarSong, trackUri: string) => void;
};

export default function RecommendedTrackCard({
  song,
  isOwned,
  resolvedTrack,
  trackLoading,
  onSelectAction,
  isSelected = false,
  ownedMode = "new",
  addStatus = "idle",
  onAddAction,
  onUndoAction,
}: RecommendedTrackCardProps) {
  // Three states: loading -> dead (no data back) -> live (has trackUri)
  const isDead = !trackLoading && (!resolvedTrack || !resolvedTrack.trackUri);
  const isLive = !trackLoading && !!resolvedTrack?.trackUri;

  const isAdding = addStatus === "adding";
  const isAdded = addStatus === "added";
  const isRemoving = addStatus === "removing";
  const isAddError = addStatus === "error";
  const isBusy = isAdding || isRemoving;

  // "new" mode: select/deselect like before
  const selectableNew = isOwned && ownedMode === "new" && isLive;
  // "add" mode: click main card body to add (idle or error only)
  const selectableAdd =
    isOwned &&
    ownedMode === "add" &&
    isLive &&
    (addStatus === "idle" || addStatus === "error");
  // non-owned: select for new playlist
  const selectableNotOwned = !isOwned && isLive;

  const isClickable = selectableNew || selectableAdd || selectableNotOwned;

  // Visual "selected / added" background inversion
  const showInverted = isSelected || (ownedMode === "add" && isAdded);

  const borderMuted = showInverted
    ? "border-white dark:border-black"
    : "border-black dark:border-white";

  const handleClick = () => {
    if (!resolvedTrack?.trackUri) return;
    if (selectableNew) {
      onSelectAction?.(song, resolvedTrack.trackUri);
    } else if (selectableAdd) {
      onAddAction?.(song, resolvedTrack.trackUri);
    } else if (selectableNotOwned) {
      onSelectAction?.(song, resolvedTrack.trackUri);
    }
  };

  const handleUndoClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // don't trigger the card's handleClick
    if (!resolvedTrack?.trackUri || isBusy) return;
    onUndoAction?.(song, resolvedTrack.trackUri);
  };

  // ── Action strip ─────────────────────────────────────────────────────────
  const showActionStrip = !isOwned || (isOwned && ownedMode === "add");

  const renderActionStrip = () => {
    // Shared base classes
    const base =
      "border-t text-[9px] font-bold tracking-[0.2em] uppercase transition-all";

    // Loading / busy states — show animated bars
    if (trackLoading || isBusy) {
      const label = isRemoving ? "■ undoing" : "■ ...";
      return (
        <div
          className={`${base} flex items-center justify-center gap-[3px] border-black/20 py-2 text-black/40 dark:border-white/20 dark:text-white/40`}
        >
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="inline-block w-[3px] origin-bottom animate-[stretch_1s_ease-in-out_infinite] bg-current"
              style={{ height: "10px", animationDelay: `${i * 0.15}s` }}
            />
          ))}
          <span className="ml-1">{label}</span>
        </div>
      );
    }

    if (isDead) {
      return (
        <div
          className={`${base} border-black/15 py-2 text-center text-black/20 dark:border-white/10 dark:text-white/15`}
        >
          ■ no match
        </div>
      );
    }

    if (isOwned && ownedMode === "add") {
      if (isAdded) {
        // Two-cell row: "■ Added" on the left + "Undo →" clickable on the right
        return (
          <div
            className={`${base} flex items-stretch border-black bg-black text-white dark:border-white dark:bg-white dark:text-black`}
          >
            <span className="flex-1 py-2 text-center">■ Added</span>
            <button
              onClick={handleUndoClick}
              className="border-l border-white/20 px-3 py-2 text-white/60 transition-colors hover:bg-white/10 dark:border-black/20 dark:text-black/60 dark:hover:bg-black/10"
            >
              Undo
            </button>
          </div>
        );
      }
      if (isAddError) {
        return (
          <div
            className={`${base} border-black/40 py-2 text-center text-black/60 dark:border-white/40 dark:text-white/60`}
          >
            ■ Error — retry
          </div>
        );
      }
      // idle — reveal on hover
      return (
        <div
          className={`${base} border-black py-2 text-center text-black/50 opacity-0 group-hover:opacity-100 dark:border-white dark:text-white/50`}
        >
          Add →
        </div>
      );
    }

    // !isOwned
    if (isSelected) {
      return (
        <div
          className={`${base} border-white bg-white py-2 text-center text-black dark:border-black dark:bg-black dark:text-white`}
        >
          ■ Selected
        </div>
      );
    }
    return (
      <div
        className={`${base} border-black bg-black py-2 text-center text-white opacity-0 group-hover:opacity-100 dark:border-white dark:bg-white dark:text-black`}
      >
        Select →
      </div>
    );
  };

  return (
    <div
      onClick={handleClick}
      className={`group border font-mono transition-colors ${
        isDead
          ? "border-black/30 bg-white text-black/40 dark:border-white/20 dark:bg-black dark:text-white/30"
          : showInverted
            ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
            : isBusy
              ? "border-black/50 bg-white text-black dark:border-white/50 dark:bg-black dark:text-white"
              : "border-black bg-white text-black dark:border-white dark:bg-black dark:text-white"
      } ${isClickable ? "cursor-pointer" : "cursor-default"}`}
    >
      {/* Square image area */}
      <div className="relative aspect-square w-full overflow-hidden bg-black/5 dark:bg-white/5">
        {trackLoading ? (
          <>
            <div className="absolute inset-0 opacity-30">
              <ImagePlaceholder />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div className="flex gap-[3px]">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="inline-block h-4 w-[3px] origin-bottom animate-[stretch_1s_ease-in-out_infinite] bg-black dark:bg-white"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <span className="text-[9px] font-bold tracking-[0.25em] text-black/50 uppercase dark:text-white/50">
                ■ loading
              </span>
            </div>
          </>
        ) : isDead ? (
          <>
            <div className="absolute inset-0 opacity-15">
              <ImagePlaceholder />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div className="flex gap-[3px]">
                {[0.25, 1, 0.5, 0.75].map((scale, i) => (
                  <span
                    key={i}
                    className="inline-block w-[3px] origin-bottom bg-black/30 dark:bg-white/30"
                    style={{ height: `${scale * 16}px` }}
                  />
                ))}
              </div>
              <span className="text-[9px] font-bold tracking-[0.25em] text-black/30 uppercase dark:text-white/25">
                ■ unavailable
              </span>
            </div>
          </>
        ) : isBusy ? (
          <>
            {resolvedTrack?.albumImage && (
              <Image
                src={resolvedTrack.albumImage}
                alt={`${song.track} album art`}
                fill
                className="object-cover opacity-40"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              />
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div className="flex gap-[3px]">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="inline-block h-4 w-[3px] origin-bottom animate-[stretch_1s_ease-in-out_infinite] bg-black dark:bg-white"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <span className="text-[9px] font-bold tracking-[0.25em] text-black/50 uppercase dark:text-white/50">
                {isRemoving ? "■ undoing" : "■ adding"}
              </span>
            </div>
          </>
        ) : resolvedTrack?.albumImage ? (
          <Image
            src={resolvedTrack.albumImage}
            alt={`${song.track} album art`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <ImagePlaceholder />
        )}
      </div>

      {/* Info strip */}
      <div
        className={`border-t p-3 ${isDead ? "border-black/20 dark:border-white/15" : borderMuted}`}
      >
        <p
          className={`truncate text-xs font-bold tracking-wide uppercase ${isDead ? "opacity-40" : ""}`}
        >
          {song.track}
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span
            className={`truncate text-xs tracking-widest uppercase ${
              isDead
                ? "text-black/25 dark:text-white/20"
                : showInverted
                  ? "text-white/60 dark:text-black/60"
                  : "text-black/40 dark:text-white/40"
            }`}
          >
            {song.artist}
          </span>
          {/* {song.score !== undefined && ( */}
          {/*   <span */}
          {/*     className={`shrink-0 text-[9px] font-bold tracking-widest uppercase ${ */}
          {/*       isDead */}
          {/*         ? "text-black/20 dark:text-white/15" */}
          {/*         : showInverted */}
          {/*           ? "text-white/50 dark:text-black/50" */}
          {/*           : "text-black/30 dark:text-white/30" */}
          {/*     }`} */}
          {/*   > */}
          {/*     {Math.round(song.score * 100)}% */}
          {/*   </span> */}
          {/* )} */}
        </div>
        {song.album && (
          <p
            className={`mt-1 truncate text-[9px] tracking-widest uppercase ${
              isDead
                ? "text-black/20 dark:text-white/15"
                : showInverted
                  ? "text-white/40 dark:text-black/40"
                  : "text-black/25 dark:text-white/25"
            }`}
          >
            {song.album}
          </p>
        )}
      </div>

      {/* Action strip */}
      {showActionStrip && renderActionStrip()}
    </div>
  );
}
