"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import debounce from "lodash.debounce";
import { api } from "~/trpc/react";

type CreateNewPlaylistCardProps = {
  selectedTracksUri: string[];
  user_id: string;
  onDismiss?: () => void;
};

type Status = "idle" | "creating" | "success" | "error";

export default function CreateNewPlaylistCard({
  selectedTracksUri,
  user_id,
  onDismiss,
}: CreateNewPlaylistCardProps) {
  const [inputValue, setInputValue] = useState("");
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  const debouncedSetName = useRef(
    debounce((value: string) => {
      setName(value);
    }, 50),
  ).current;

  useEffect(() => {
    return () => {
      debouncedSetName.cancel();
    };
  }, [debouncedSetName]);

  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(value);
      debouncedSetName(value);
    },
    [debouncedSetName],
  );

  const count = selectedTracksUri.length;
  const canSubmit = name.trim().length > 0 && count > 0 && status === "idle";

  const createPlaylistMutation =
    api.playlist.createPlaylistWithTracks.useMutation();

  const mutationErrMessage =
    createPlaylistMutation.error?.message ?? "Something went wrong. Try again.";

  const handleCreate = useCallback(async () => {
    if (!canSubmit) return;

    setStatus("creating");

    try {
      await createPlaylistMutation.mutateAsync({
        track_uris: selectedTracksUri,
        isPublic,
        name: name.trim(),
        description: "",
        user_id,
      });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }, [
    canSubmit,
    createPlaylistMutation,
    selectedTracksUri,
    isPublic,
    name,
    user_id,
  ]);

  function handleReset() {
    setInputValue("");
    setName("");
    setIsPublic(false);
    setStatus("idle");
    onDismiss?.();
  }

  const isCreating = status === "creating";
  const isSuccess = status === "success";

  return (
    // Brutalist floating panel — hard offset shadow lifts it off the page
    <div className="mx-6 mb-6 border-2 border-black bg-white font-mono text-black shadow-[6px_6px_0_0_#000] dark:border-white dark:bg-black dark:text-white dark:shadow-[6px_6px_0_0_#fff]">
      {/* Header row */}
      <div className="flex items-center justify-between border-b border-black px-6 py-3 dark:border-white">
        <span className="text-[9px] font-bold tracking-[0.25em] text-black/50 uppercase dark:text-white/50">
          / New playlist
        </span>
        <div className="flex items-center gap-3">
          {/* Track count badge */}
          <span className="border border-black px-2 py-0.5 text-[9px] font-bold tracking-[0.2em] uppercase dark:border-white">
            {count} {count === 1 ? "track" : "tracks"}
          </span>
          {/* Dismiss */}
          {onDismiss && (
            <button
              onClick={handleReset}
              className="text-[9px] font-bold tracking-[0.2em] text-black/40 uppercase transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
            >
              ✕ clear
            </button>
          )}
        </div>
      </div>

      {isSuccess ? (
        // ── Success state ──────────────────────────────────────────────────
        <div className="flex items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase">
              ■ Playlist created
            </p>
            <p className="mt-1 text-[9px] tracking-widest text-black/40 uppercase dark:text-white/40">
              &ldquo;{name}&rdquo; &mdash; {isPublic ? "public" : "private"}{" "}
              &middot; {count} tracks
            </p>
          </div>
          <button
            onClick={handleReset}
            className="border border-black px-4 py-2 text-[9px] font-bold tracking-[0.2em] uppercase transition-colors hover:bg-black hover:text-white dark:border-white dark:hover:bg-white dark:hover:text-black"
          >
            Done →
          </button>
        </div>
      ) : (
        // ── Form state ─────────────────────────────────────────────────────
        <div className="flex items-stretch">
          {/* Playlist name input */}
          <div className="flex-1 border-r border-black dark:border-white">
            <label className="block border-b border-black/20 px-6 py-1.5 text-[8px] font-bold tracking-[0.25em] text-black/40 uppercase dark:border-white/20 dark:text-white/40">
              Playlist name
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              disabled={isCreating}
              placeholder="My new playlist..."
              maxLength={100}
              className="w-full bg-transparent px-6 py-4 text-sm font-bold tracking-wide placeholder-black/25 outline-none disabled:opacity-40 dark:placeholder-white/25"
            />
          </div>

          {/* Privacy toggle */}
          <div className="shrink-0 border-r border-black dark:border-white">
            <p className="border-b border-black/20 px-5 py-1.5 text-[8px] font-bold tracking-[0.25em] text-black/40 uppercase dark:border-white/20 dark:text-white/40">
              Privacy
            </p>
            <div className="flex h-[52px] items-center">
              <button
                onClick={() => setIsPublic(false)}
                disabled={isCreating}
                className={`h-full border-r border-black/20 px-5 text-[9px] font-bold tracking-[0.2em] uppercase transition-colors dark:border-white/20 ${
                  !isPublic
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white"
                }`}
              >
                Private
              </button>
              <button
                onClick={() => setIsPublic(true)}
                disabled={isCreating}
                className={`h-full px-5 text-[9px] font-bold tracking-[0.2em] uppercase transition-colors ${
                  isPublic
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white"
                }`}
              >
                Public
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            onClick={handleCreate}
            disabled={!canSubmit}
            className={`flex shrink-0 flex-col items-center justify-center gap-1.5 px-8 text-[9px] font-bold tracking-[0.2em] uppercase transition-colors disabled:cursor-not-allowed ${
              canSubmit
                ? "bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
                : "bg-black/10 text-black/30 dark:bg-white/10 dark:text-white/30"
            }`}
          >
            {isCreating ? (
              <>
                <div className="flex gap-[3px]">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`inline-block w-[3px] origin-bottom animate-[stretch_1s_ease-in-out_infinite] ${canSubmit || isCreating ? "bg-white dark:bg-black" : "bg-black/30 dark:bg-white/30"}`}
                      style={{ height: "14px", animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <span>Creating</span>
              </>
            ) : (
              <>
                <span className="text-base leading-none">+</span>
                <span>Create</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="border-t border-black/20 px-6 py-2 text-[9px] font-bold tracking-[0.2em] text-black/60 uppercase dark:border-white/20 dark:text-white/60">
          ■ {mutationErrMessage}
          <button
            onClick={() => setStatus("idle")}
            className="ml-3 underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
