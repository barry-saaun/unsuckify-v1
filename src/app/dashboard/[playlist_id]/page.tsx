"use client";
import { useParams, useSearchParams } from "next/navigation";
import ErrorScreen from "~/components/error-screen";
import { useState } from "react";
import LoadingMessages from "~/components/loading-messages";
import { Button } from "~/components/ui/button";
import Spinner from "~/components/spinner";
import InfoBanner from "~/components/info-banner";
import CreateNewPlaylistCard from "~/components/create-new-playlist-card";
import { useRecommendedInfTracks } from "~/hooks/useRecommendedInfTracks";
import RecommendedTrackCard from "~/components/recommended-track-card";
import RecommendedTrackCardSkeleton from "~/components/rec-track-card-skeleton";
import { useUserContext } from "~/components/user-context-provider";
import { cn } from "~/lib/utils";

const TRACK_PER_INF_PAGE = 6;

export default function PlaylistContent() {
  const params = useParams<{ playlist_id: string }>();

  const searchParams = useSearchParams();

  const { userId } = useUserContext();

  const ownerId = searchParams.get("ownerId");
  const playlistName = searchParams.get("playlistName");

  let isOwned: boolean;

  if (ownerId && ownerId === userId) {
    isOwned = true;
  } else {
    isOwned = false;
  }

  const playlist_id = params.playlist_id;

  const {
    data,
    isLoadingAny,
    errorAny,
    fetchNextPage,
    isFetchingNextPage,
    playlistData,
    rec_tracks,
    hasNextPage,
  } = useRecommendedInfTracks({
    playlist_id: playlist_id ?? "",
    userId: userId ?? "",
    limit: TRACK_PER_INF_PAGE,
  });

  const [selectedTracksUri, setSelectedTracksUri] = useState(
    new Set<string>(new Set()),
  );

  const [skeletonPages, setSkeletonPages] = useState(0);

  const handleFetchNextPage = async () => {
    setSkeletonPages((prev) => prev + 1);
    try {
      await fetchNextPage();
    } finally {
      setSkeletonPages((prev) => Math.max(0, prev - 1));
    }
  };

  const handleNotIsOwnedCardClick = (track_uri: string) => {
    setSelectedTracksUri((prevUris) => {
      const newUris = new Set(prevUris);
      if (newUris.has(track_uri)) {
        newUris.delete(track_uri);
      } else {
        newUris.add(track_uri);
      }
      return newUris;
    });
  };

  console.log(selectedTracksUri);

  // Handle loading states for either query
  if (isLoadingAny) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="hungry-loader" />
        <LoadingMessages interval={2500} />
      </div>
    );
  }

  if (errorAny) {
    return <ErrorScreen message={errorAny.message} />;
  }

  if (playlistData === null) {
    console.error("No playlist data found.");
    return <ErrorScreen message="No playlist data found." />;
  }

  if (rec_tracks === null) {
    console.error("No recommendation data found.");
    return <ErrorScreen message="No recommendation data found." />;
  }

  if (!userId) {
    return <ErrorScreen message="Sorry! We could not get your Spotify ID." />;
  }

  if (!playlist_id) {
    return <ErrorScreen message="Invalid Playlist ID." />;
  }

  return (
    <div className="mx-6 mb-10 flex min-h-screen flex-col items-center justify-center gap-6 border-none md:mx-8 lg:mx-10">
      {playlistName && (
        <div className="mt-10 mb-8 text-center">
          <h1 className="text-center text-3xl font-bold text-gray-900 md:text-4xl lg:text-5xl dark:text-gray-100">
            {playlistName}
          </h1>
          <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
        </div>
      )}

      <div className="w-full max-w-6xl space-y-6">
        {!isOwned && (
          <CreateNewPlaylistCard
            selectedTracksUri={Array.from(selectedTracksUri)}
            user_id={userId}
          />
        )}

        <InfoBanner isOwned={isOwned} />

        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data?.pages.flatMap((page) =>
            page.items.map((item, i) => (
              <RecommendedTrackCard
                key={`${i}-${item.id}`}
                playlist_id={playlist_id}
                handleNotIsOwnedCardClick={handleNotIsOwnedCardClick}
                trackObj={item}
                isOwned={isOwned}
                track_id={item.id}
                batch_id={item.batchId!}
              />
            )),
          )}

          {Array.from({ length: skeletonPages }, (_, pageIndex) =>
            Array.from({ length: TRACK_PER_INF_PAGE }, (_, itemIndex) => (
              <RecommendedTrackCardSkeleton
                isOwned
                key={`skeleton-${pageIndex}-${itemIndex}`}
              />
            )),
          )}
        </div>

        {hasNextPage ? (
          <div className="flex justify-center pt-4">
            <Button
              disabled={isFetchingNextPage}
              onClick={handleFetchNextPage}
              className={cn(
                "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600",
                "px-8 py-6 text-base font-medium",
              )}
            >
              {isFetchingNextPage ? <Spinner /> : "Load More Tracks"}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
