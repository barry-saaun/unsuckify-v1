"use client";
import { api } from "~/trpc/react";
import CardSkeleton from "./card-skeleton";
import PlaylistCard from "./playlist-card";
import ImagePlaceholder from "./image-placeholder";
import useIsAuthenticated from "~/hooks/useIsAuthenticated";
import ErrorScreen from "./error-screen";
import { useAppToast } from "~/hooks/useAppToast";
import { useMemo, useState } from "react";

const numberOfSkeleton = 10;

export default function MyPlaylistsTabContent() {
  const { isAuthenticated } = useIsAuthenticated();
  const [search, setSearch] = useState("");
  const {
    data: fresh,
    isLoading,
    error,
  } = api.user.getListOfCurrentUsersPlaylists.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const { toastError } = useAppToast();

  if (error && !isLoading) {
    toastError("Cannot query your playlists at the moment!", {
      id: "playlist-error",
    });
  }

  const filtered = useMemo(() => {
    if (!fresh) return [];
    const q = search.trim().toLowerCase();

    if (!q) return fresh;

    return fresh.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.owner.toLowerCase().includes(q),
    );
  }, [fresh, search]);

  if (!isAuthenticated) return null;

  if (error) return <ErrorScreen message={error.message} />;

  return (
    <div className="flex flex-col">
      {/* Search bar */}
      <div className="border-b border-black px-6 py-3 dark:border-white">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="/ Search playlists..."
          className="w-full bg-transparent text-xs tracking-widest text-black uppercase outline-none placeholder:text-black/30 dark:text-white dark:placeholder:text-white/30"
        />
      </div>

      <div className="p-6">
        {!isLoading && filtered.length === 0 && search ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 border border-black p-12 dark:border-white">
            <p className="text-xs tracking-widest text-black/30 uppercase dark:text-white/30">
              / No results
            </p>
            <h2 className="text-center text-4xl leading-none font-bold tracking-tight text-black uppercase dark:text-white">
              Nothing
              <br />
              Found.
            </h2>
            <p className="text-xs tracking-widest text-black/50 uppercase dark:text-white/50">
              &quot;{search}&quot; matched 0 playlists
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 border-l border-t border-black sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 dark:border-white/40">
            {isLoading
              ? Array.from({ length: numberOfSkeleton }).map((_, idx) => (
                  <div key={idx} className="border-r border-b border-black bg-white dark:border-white/40 dark:bg-black">
                    <CardSkeleton />
                  </div>
                ))
              : filtered?.map((item) => (
                  <div key={item.id} className="border-r border-b border-black bg-white dark:border-white/40 dark:bg-black">
                    <PlaylistCard
                      ownerId={item.ownerId}
                      playlistImg={item.url ? item.url : <ImagePlaceholder />}
                      owner={item.owner}
                      playlistName={item.name}
                      numberOfTracks={item.total}
                      playlistId={item.id}
                    />
                  </div>
                ))}
          </div>
        )}
      </div>
    </div>
  );
}
