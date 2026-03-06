"use client";
import type { SimilarSong } from "~/lib/pinecone/find-similar-songs";
import Image from "next/image";
import ImagePlaceholder from "./image-placeholder";
import { api } from "~/trpc/react";

// async function mockFetchSpotifyData(
//   _song: SimilarSong,
// ): Promise<TrackSpotifyData> {
//   // Artificial delay — replace with real API call later
//   await new Promise((resolve) =>
//     setTimeout(resolve, 2000 + Math.random() * 1500),
//   );
//   return {
//     trackUri: "spotify:track:mock",
//     albumImage: "",
//   };
// }

type RecommendedTrackCardProps = {
  song: SimilarSong;
  isOwned: boolean;
  onSelectAction?: (song: SimilarSong) => void;
  isSelected?: boolean;
};

export default function RecommendedTrackCard({
  song,
  isOwned,
  onSelectAction: onSelect,
  isSelected = false,
}: RecommendedTrackCardProps) {
  const { artist, track, album } = song;

  const { data: searchedTrack, isLoading: trackLoading } =
    api.track.searchForTracks.useQuery({
      artists: artist,
      track,
      album,
    });

  console.log(
    `[seached track] track: ${track} \n` +
      JSON.stringify(searchedTrack, null, 2) +
      "\n",
  );

  // Three states: loading -> dead (no data back) -> live (has trackUri)
  const isDead = !trackLoading && !searchedTrack;
  const isLive = !trackLoading && !!searchedTrack;

  const selectable = !isOwned && isLive;

  const borderMuted = isSelected
    ? "border-white dark:border-black"
    : "border-black dark:border-white";

  return (
    <div
      onClick={() => selectable && onSelect?.(song)}
      className={`group border font-mono transition-colors ${
        isDead
          ? "border-black/30 bg-white text-black/40 dark:border-white/20 dark:bg-black dark:text-white/30"
          : isSelected
            ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
            : "border-black bg-white text-black dark:border-white dark:bg-black dark:text-white"
      } ${selectable ? "cursor-pointer" : "cursor-default"}`}
    >
      {/* Square image area */}
      <div className="relative aspect-square w-full overflow-hidden bg-black/5 dark:bg-white/5">
        {trackLoading ? (
          <>
            {/* Dimmed placeholder behind loader */}
            <div className="absolute inset-0 opacity-30">
              <ImagePlaceholder />
            </div>
            {/* Brutalist loading overlay */}
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
            {/* Very faint placeholder */}
            <div className="absolute inset-0 opacity-15">
              <ImagePlaceholder />
            </div>
            {/* Dead-state overlay — frozen bars */}
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
        ) : searchedTrack?.albumImage ? (
          <Image
            src={searchedTrack.albumImage}
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
                : isSelected
                  ? "text-white/60 dark:text-black/60"
                  : "text-black/40 dark:text-white/40"
            }`}
          >
            {song.artist}
          </span>
          {song.score !== undefined && (
            <span
              className={`shrink-0 text-[9px] font-bold tracking-widest uppercase ${
                isDead
                  ? "text-black/20 dark:text-white/15"
                  : isSelected
                    ? "text-white/50 dark:text-black/50"
                    : "text-black/30 dark:text-white/30"
              }`}
            >
              {Math.round(song.score * 100)}%
            </span>
          )}
        </div>
        {/* Album name — tertiary row */}
        {song.album && (
          <p
            className={`mt-1 truncate text-[9px] tracking-widest uppercase ${
              isDead
                ? "text-black/20 dark:text-white/15"
                : isSelected
                  ? "text-white/40 dark:text-black/40"
                  : "text-black/25 dark:text-white/25"
            }`}
          >
            {song.album}
          </p>
        )}
      </div>

      {/* Select action — only for non-owned playlists */}
      {!isOwned && (
        <div
          className={`border-t py-2 text-center text-[9px] font-bold tracking-[0.2em] uppercase transition-opacity ${
            trackLoading
              ? "border-black/20 text-black/20 opacity-100 dark:border-white/20 dark:text-white/20"
              : isDead
                ? "border-black/15 text-black/20 opacity-100 dark:border-white/10 dark:text-white/15"
                : isSelected
                  ? "border-white bg-white text-black opacity-100 dark:border-black dark:bg-black dark:text-white"
                  : "border-black bg-black text-white opacity-0 group-hover:opacity-100 dark:border-white dark:bg-white dark:text-black"
          }`}
        >
          {trackLoading
            ? "■ ..."
            : isDead
              ? "■ no match"
              : isSelected
                ? "■ Selected"
                : "Select →"}
        </div>
      )}
    </div>
  );
}
