"use client";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import CardSkeleton from "./card-skeleton";
import PlaylistCard from "./playlist-card";
import ImagePlaceholder from "./image-placeholder";
import useIsAuthenticated from "~/hooks/useIsAuthenticated";
import Spinner from "./spinner";
import ErrorScreen from "./error-screen";

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

  if (error && !isLoading) {
    toast.error("Cannot query your playlists at the moment!", {
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
                key={item.id}
                playlistImg={item.url ? item.url : <ImagePlaceholder />}
                owner={item.display_name}
                playlistName={item.name}
                numberOfTracks={item.total}
                playlistId={item.id}
              />
            );
          })}
    </div>
  );
}
