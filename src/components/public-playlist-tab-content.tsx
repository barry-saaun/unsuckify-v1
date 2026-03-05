"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppToast } from "~/hooks/useAppToast";
import { cn } from "~/lib/utils";

function PublicPlaylistTabContent() {
  const router = useRouter();
  const { toastError } = useAppToast();
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isValidSpotifyUrl = (input: string) => {
    const regex =
      /^https:\/\/open\.spotify\.com\/playlist\/[a-zA-Z0-9]+(\?si=[a-zA-Z0-9]+)?$|^https:\/\/open\.spotify\.com\/playlist\/[a-zA-Z0-9]+$/;
    return regex.test(input.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      toastError("Playlist URL can't be empty");
      return;
    }

    if (!isValidSpotifyUrl(url)) {
      toastError("Invalid Spotify playlist URL");
      return;
    }

    setIsLoading(true);

    try {
      const playlistId = url.split("?si")[0]?.split("playlist/")[1];
      if (playlistId) {
        router.push(`/dashboard/${playlistId}`);
      }
    } catch {
      toastError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const valid = isValidSpotifyUrl(url);
  const canSubmit = !isLoading && !!url.trim() && valid;

  return (
    <div className="flex h-full items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg font-mono">
        {/* Label */}
        <p className="mb-6 text-xs tracking-widest text-black/40 uppercase dark:text-white/40">
          / Paste a public Spotify playlist URL
        </p>

        {/* Title */}
        <h2 className="mb-8 text-3xl font-bold tracking-tight text-black uppercase dark:text-white">
          Find Similar
          <br />
          Tracks.
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Input */}
          <div className="relative">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://open.spotify.com/playlist/..."
              disabled={isLoading}
              className={cn(
                "w-full border border-black bg-white px-4 py-4 text-sm text-black placeholder-black/30 focus:outline-none dark:border-white dark:bg-black dark:text-white dark:placeholder-white/30",
                url.trim() && !valid && "border-red-600 dark:border-red-500",
                valid && "border-black dark:border-white",
              )}
            />
            {/* Validation tick */}
            {valid && (
              <span className="absolute top-1/2 right-4 -translate-y-1/2 text-xs tracking-widest text-black/40 uppercase dark:text-white/40">
                ✓
              </span>
            )}
          </div>

          {/* Error hint */}
          {url.trim() && !valid && (
            <p className="mt-2 text-xs tracking-widest text-red-600 uppercase dark:text-red-500">
              Invalid Spotify playlist URL
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-0 w-full border border-t-0 border-black bg-black py-4 text-sm font-bold tracking-widest text-white uppercase transition-opacity hover:opacity-80 disabled:opacity-30 dark:border-white dark:bg-white dark:text-black"
          >
            {isLoading ? "Finding tracks..." : "Find similar tracks →"}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-xs tracking-widest text-black/30 uppercase dark:text-white/30">
          Works with any public Spotify playlist
        </p>
      </div>
    </div>
  );
}

export default PublicPlaylistTabContent;
