"use client";
import useIsAuthenticated from "~/hooks/useIsAuthenticated";
import Link from "next/link";

const HeroSection = () => {
  const { isAuthenticated } = useIsAuthenticated();

  return (
    <div className="flex h-full flex-col overflow-hidden font-mono">
      {/* Main hero — fills remaining height */}
      <div className="flex flex-1 flex-col border-b border-black dark:border-white">
        {/* Top label row */}
        <div className="flex items-center justify-between border-b border-black px-6 py-3 dark:border-white">
          <span className="text-xs tracking-widest text-black/40 uppercase dark:text-white/40">
            / Hero
          </span>
          <span className="text-xs tracking-widest text-black/40 uppercase dark:text-white/40">
            ■
          </span>
        </div>

        {/* Hero content */}
        <div className="flex flex-1 flex-col items-start justify-center px-6 py-8 md:px-12 lg:px-20">
          <p className="mb-6 text-xs tracking-widest text-black/40 uppercase dark:text-white/40">
            / Your playlists are mid.
          </p>
          <h1 className="max-w-3xl text-5xl leading-none font-bold tracking-tight text-black sm:text-6xl lg:text-6xl dark:text-white">
            STOP
            <br />
            LISTENING
            <br />
            TO THE SAME
            <br />
            67 SONGS.
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-black/60 dark:text-white/60">
            Connect your Spotify. Pick a playlist. Get AI recommendations that
            actually fit — no fluff, no filters, no vibe-check marketing copy.
            Get <span className="uppercase">SENDY.</span>
          </p>

          <div className="mt-8 flex flex-col gap-0 sm:flex-row">
            <Link
              href={isAuthenticated ? "/dashboard" : "/login"}
              className="border border-black bg-black px-8 py-4 text-sm font-bold tracking-widest text-white uppercase transition-opacity hover:opacity-80 dark:border-white dark:bg-white dark:text-black"
            >
              {isAuthenticated ? "Go to Dashboard →" : "Get Started →"}
            </Link>
            {!isAuthenticated && (
              <a
                href="https://github.com/barry-saaun/unsuckify-v1"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-l-0 border-black bg-transparent px-8 py-4 text-sm font-bold tracking-widest text-black uppercase transition-opacity hover:opacity-60 sm:border-l-0 dark:border-white dark:text-white"
              >
                View Source
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Bottom stats bar */}
      <div className="grid grid-cols-3 divide-x divide-black dark:divide-white">
        <div className="px-6 py-5">
          <p className="mb-1 text-xs tracking-widest text-black/40 uppercase dark:text-white/40">
            / Powered by
          </p>
          <p className="text-sm font-bold tracking-wide text-black uppercase dark:text-white">
            Spotify API
          </p>
        </div>
        <div className="px-6 py-5">
          <p className="mb-1 text-xs tracking-widest text-black/40 uppercase dark:text-white/40">
            / Method
          </p>
          <p className="text-sm font-bold tracking-wide text-black uppercase dark:text-white">
            Vector Similarity
          </p>
        </div>
        <div className="px-6 py-5">
          <p className="mb-1 text-xs tracking-widest text-black/40 uppercase dark:text-white/40">
            / Privacy
          </p>
          <p className="text-sm font-bold tracking-wide text-black uppercase dark:text-white">
            No Data Stored
          </p>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
