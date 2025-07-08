"use client";
import { api } from "~/trpc/react";
import CardSkeleton from "./card-skeleton";
import PlaylistCard from "./playlist-card";
import ImagePlaceholder from "./image-placeholder";
import useIsAuthenticated from "~/hooks/useIsAuthenticated";
import Spinner from "./spinner";
import ErrorScreen from "./error-screen";
import { useAppToast } from "~/hooks/useAppToast";

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

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner extraCN="h-10 w-10" />
      </div>
    );
  }

  if (error) {
    return <ErrorScreen message={error.message} />;
  }

  const numberOfSkeleton = 6;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {isLoading
        ? Array.from({ length: numberOfSkeleton }).map((_, idx) => (
            <CardSkeleton key={idx} />
          ))
        : fresh?.map((item) => {
            return (
              <PlaylistCard
                ownerId={item.ownerId}
                key={item.id}
                playlistImg={item.url ? item.url : <ImagePlaceholder />}
                owner={item.owner}
                playlistName={item.name}
                numberOfTracks={item.total}
                playlistId={item.id}
              />
            );
          })}
    </div>
  );
}
