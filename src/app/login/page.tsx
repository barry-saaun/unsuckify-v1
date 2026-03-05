"use client";
import { Icons, Spinner } from "~/components/Icons";
import { useState } from "react";

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    window.location.href = "/api/login";
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="flex h-full w-full flex-col bg-white font-mono dark:bg-black">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-black px-6 py-4 dark:border-white">
        <button
          onClick={handleGoBack}
          className="text-xs tracking-widest text-black uppercase transition-opacity hover:opacity-60 dark:text-white"
        >
          ← Back
        </button>
        <span className="text-xs tracking-widest text-black/40 uppercase dark:text-white/40">
          / Login
        </span>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          {/* Title block */}
          <div className="mb-0 border border-black p-8 dark:border-white">
            <p className="mb-4 text-xs tracking-widest text-black/40 uppercase dark:text-white/40">
              / UNSUCKify
            </p>
            <h1 className="mb-4 text-4xl leading-none font-bold tracking-tight text-black dark:text-white">
              FIX YOUR
              <br />
              PLAYLISTS.
            </h1>
            <p className="text-sm leading-relaxed text-black/60 dark:text-white/60">
              Stop listening to the same 40 songs. Connect your Spotify and get
              recommendations that don&apos;t suck.
            </p>
          </div>

          {/* Login button */}
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 border border-t-0 border-black bg-black px-6 py-4 text-sm font-bold tracking-widest text-white uppercase transition-opacity hover:opacity-80 disabled:opacity-40 dark:border-white dark:bg-white dark:text-black"
          >
            {isLoading ? (
              <Spinner size={18} />
            ) : (
              <>
                <Icons.spotify className="h-4 w-4 fill-current" />
                <span>Continue with Spotify</span>
              </>
            )}
          </button>

          {/* Footer note */}
          <p className="mt-4 text-center text-xs tracking-wider text-black/40 uppercase dark:text-white/40">
            Playlist access only. No data stored.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
