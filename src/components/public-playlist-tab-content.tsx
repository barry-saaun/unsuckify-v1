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
    } catch (error) {
      toastError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/50 to-zinc-800/50 p-8 shadow-2xl backdrop-blur-sm">
        <div className="mb-6">
          <h2 className="text-bold mb-2 text-3xl font-medium">
            Discover new music
          </h2>
          <p className="text-lg text-zinc-400">
            Paste a Spotify playlist URL and let us find similar tracks you'll
            love
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute top-1/2 left-4 -translate-y-1/2">
              <svg
                className={cn(
                  "h-5 w-5 transition-colors duration-200",
                  isValidSpotifyUrl(url) ? "text-green-500" : "text-zinc-500",
                )}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://open.spotify.com/playlist/..."
              className={cn(
                "w-full rounded-xl border border-white/10 bg-zinc-800/50 py-4 pr-4 pl-12 text-white placeholder-zinc-500 transition-all duration-200 focus:ring-1 focus:outline-none",
                {
                  "focus:border-green-500 focus:ring-green-500":
                    isValidSpotifyUrl(url),
                  "focus:border-red-500 focus:ring-red-500":
                    !isValidSpotifyUrl(url),
                },
              )}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !url.trim() || !isValidSpotifyUrl(url)}
            className="w-full transform rounded-xl bg-green-600 py-4 font-medium text-white transition-all duration-200 hover:scale-[1.02] hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500 disabled:hover:scale-100"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span>Finding tracks...</span>
              </div>
            ) : (
              "Find similar tracks"
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-white/10 pt-6">
          <p className="text-center text-sm text-zinc-500">
            Works with any public Spotify playlist
          </p>
        </div>
      </div>
    </div>
  );
}

export default PublicPlaylistTabContent;
