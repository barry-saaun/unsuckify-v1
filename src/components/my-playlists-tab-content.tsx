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
  const numberOfSkeleton = 8;

  if (error && !isLoading) {
    toastError("Cannot query your playlists at the moment!", {
      id: "playlist-error",
    });
  }

  if (!isAuthenticated) {
    return null;
  }

  // Show skeleton loading instead of full-screen spinner
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-8 px-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: numberOfSkeleton }).map((_, idx) => (
          <CardSkeleton key={idx} />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorScreen message={error.message} />;
  }

  return (
    <div className="grid grid-cols-1 gap-8 px-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {fresh?.map((item) => (
        <PlaylistCard
          ownerId={item.ownerId}
          key={item.id}
          playlistImg={item.url ? item.url : <ImagePlaceholder />}
          owner={item.owner}
          playlistName={item.name}
          numberOfTracks={item.total}
          playlistId={item.id}
        />
      ))}
    </div>
  );
}
