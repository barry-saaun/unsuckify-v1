"use client";
import { useMemo } from "react";
import { api } from "~/trpc/react";
import type { SimilarSong } from "~/lib/pinecone/find-similar-songs";

export type ResolvedTrack = {
  trackUri: string | undefined;
  albumImage: string | null | undefined;
} | null;

/**
 * Resolves Spotify track data (trackUri + albumImage) for a list of SimilarSongs
 * by lifting the searchForTracks queries out of individual cards.
 *
 * Returns:
 *  - `resolvedMap`: Map<songKey, ResolvedTrack> — null while loading, object when settled
 *  - `loadingMap`:  Map<songKey, boolean>
 */
export function useResolvedTracks(songs: SimilarSong[]): {
  resolvedMap: Map<string, ResolvedTrack>;
  loadingMap: Map<string, boolean>;
} {
  const results = api.useQueries((t) =>
    songs.map((song) =>
      t.track.spotifySearchForTrack(
        {
          songKey: song.songKey,
          artists: song.artist,
          track: song.track,
          album: song.album,
        },
        {
          retry: (failureCount, error) => {
            if (error.data?.code === "NOT_FOUND") return false;

            return failureCount < 2;
          },
          staleTime: Infinity,
        },
      ),
    ),
  );

  const resolvedMap = useMemo(() => {
    const map = new Map<string, ResolvedTrack>();
    songs.forEach((song, i) => {
      const result = results[i];
      if (result?.error?.data?.code === "NOT_FOUND") {
        // Definitively not on Spotify — treat as resolved with no data
        map.set(song.songKey, null);
      } else if (!result || result.isLoading) {
        map.set(song.songKey, null);
      } else {
        map.set(song.songKey, result.data ?? null);
      }
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, songs]);

  const loadingMap = useMemo(() => {
    const map = new Map<string, boolean>();
    songs.forEach((song, i) => {
      map.set(song.songKey, results[i]?.isLoading ?? true);
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, songs]);

  return { resolvedMap, loadingMap };
}
