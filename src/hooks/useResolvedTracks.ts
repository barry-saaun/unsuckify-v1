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
      t.track.searchForTrack({
        songKey: song.songKey,
        artists: song.artist,
        track: song.track,
        album: song.album,
      }),
    ),
  );

  const resolvedMap = useMemo(() => {
    const map = new Map<string, ResolvedTrack>();
    songs.forEach((song, i) => {
      const result = results[i];
      if (!result || result.isLoading) {
        map.set(song.songKey, null);
      } else {
        // data is { trackUri, albumImage } | null (null = not found on Spotify)
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
