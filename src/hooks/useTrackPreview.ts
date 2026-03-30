"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import { api } from "~/trpc/react";
import type { SimilarSong } from "~/lib/pinecone/find-similar-songs";

export type PreviewState =
  | { status: "idle" }
  | { status: "fetching"; song: SimilarSong }
  | { status: "no_preview"; song: SimilarSong }
  | { status: "playing"; song: SimilarSong; previewUrl: string }
  | { status: "paused"; song: SimilarSong; previewUrl: string };

export type PreviewControls = {
  previewState: PreviewState;
  progress: number; // 0–1
  requestPreview: (song: SimilarSong) => void;
  togglePlayPause: () => void;
  dismiss: () => void;
};

export function useTrackPreview(): PreviewControls {
  const [previewState, setPreviewState] = useState<PreviewState>({
    status: "idle",
  });
  const [progress, setProgress] = useState(0);

  // Holds the song we want to fetch next — triggers the query
  const [fetchTarget, setFetchTarget] = useState<SimilarSong | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // Deezer preview URL query — only runs when fetchTarget is set
  const { data: previewData, isFetching } =
    api.track.deezerSearchForPreviewUrl.useQuery(
      fetchTarget
        ? {
            songKey: fetchTarget.songKey,
            track: fetchTarget.track,
            album: fetchTarget.album,
            artists: fetchTarget.artist,
          }
        : // Should never be called when null due to `enabled`
          { songKey: "", track: "", album: "", artists: "" },
      {
        enabled: !!fetchTarget,
        retry: false,
        staleTime: Infinity,
      },
    );

  useEffect(() => {
    if (!fetchTarget) return;
    if (isFetching) return;

    if (previewData?.previewUrl) {
      stopCurrent();
      const audio = new Audio(previewData.previewUrl);
      audioRef.current = audio;

      const tick = () => {
        if (!audioRef.current || audioRef.current !== audio) return;
        if (audio.duration > 0) {
          setProgress(audio.currentTime / audio.duration);
        }
        rafRef.current = requestAnimationFrame(tick);
      };

      audio.addEventListener("play", () => {
        rafRef.current = requestAnimationFrame(tick);
      });
      audio.addEventListener("pause", () => {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      });
      audio.addEventListener("ended", () => {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        setPreviewState((s) =>
          s.status === "playing" ? { ...s, status: "paused" } : s,
        );
        setProgress(1);
      });

      void audio.play();
      setPreviewState({
        status: "playing",
        song: fetchTarget,
        previewUrl: previewData.previewUrl,
      });
    } else {
      // Error / no result
      setPreviewState({ status: "no_preview", song: fetchTarget });
    }

    // Clear so subsequent clicks on same song still work cleanly
    setFetchTarget(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFetching, previewData, fetchTarget]);

  const stopCurrent = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setProgress(0);
  }, []);

  const requestPreview = useCallback(
    (song: SimilarSong) => {
      // If the same song is already playing, just toggle
      if (
        previewState.status === "playing" &&
        previewState.song.songKey === song.songKey
      ) {
        audioRef.current?.pause();
        setPreviewState({ ...previewState, status: "paused" });
        return;
      }
      if (
        previewState.status === "paused" &&
        previewState.song.songKey === song.songKey
      ) {
        void audioRef.current?.play();
        setPreviewState({ ...previewState, status: "playing" });
        return;
      }

      // New song — stop current and kick off fetch
      stopCurrent();
      setPreviewState({ status: "fetching", song });
      setFetchTarget(song);
    },
    [previewState, stopCurrent],
  );

  const togglePlayPause = useCallback(() => {
    if (previewState.status === "playing") {
      audioRef.current?.pause();
      setPreviewState({ ...previewState, status: "paused" });
    } else if (previewState.status === "paused") {
      void audioRef.current?.play();
      setPreviewState({ ...previewState, status: "playing" });
    }
  }, [previewState]);

  const dismiss = useCallback(() => {
    stopCurrent();
    setPreviewState({ status: "idle" });
    setFetchTarget(null);
  }, [stopCurrent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  return { previewState, progress, requestPreview, togglePlayPause, dismiss };
}
