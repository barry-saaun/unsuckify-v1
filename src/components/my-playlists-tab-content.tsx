"use client";
import { api } from "~/trpc/react";
import CardSkeleton from "./card-skeleton";
import PlaylistCard from "./playlist-card";
import ImagePlaceholder from "./image-placeholder";
import useIsAuthenticated from "~/hooks/useIsAuthenticated";
import ErrorScreen from "./error-screen";
import { useAppToast } from "~/hooks/useAppToast";

const numberOfSkeleton = 10;

export default function MyPlaylistsTabContent() {
  const { isAuthenticated } = useIsAuthenticated();
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

  if (!isAuthenticated) return null;

  if (error) return <ErrorScreen message={error.message} />;

  return (
    <div className="p-6">
      <div className="grid grid-cols-2 gap-px border border-black bg-black sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 dark:border-white/40 dark:bg-white/5">
        {isLoading
          ? Array.from({ length: numberOfSkeleton }).map((_, idx) => (
              <div key={idx} className="bg-white dark:bg-black">
                <CardSkeleton />
              </div>
            ))
          : fresh?.map((item) => (
              <div key={item.id} className="bg-white dark:bg-black">
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
    </div>
  );
}
