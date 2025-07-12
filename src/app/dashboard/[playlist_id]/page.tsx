"use client";
import { useParams, useSearchParams } from "next/navigation";
import ErrorScreen from "~/components/error-screen";
import { useEffect, useState } from "react";
import LoadingMessages from "~/components/loading-messages";
import { Button } from "~/components/ui/button";
import Spinner from "~/components/spinner";
import InfoBanner from "~/components/info-banner";
import CreateNewPlaylistCard from "~/components/create-new-playlist-card";
import { useRecommendedInfTracks } from "~/hooks/useRecommendedInfTracks";
import RecommendedTrackCard from "~/components/recommended-track-card";
import RecommendedTrackCardSkeleton from "~/components/rec-track-card-skeleton";
import { useAppToast } from "~/hooks/useAppToast";

const TRACK_PER_INF_PAGE = 2;

function useUserId() {
  const [userId, setUserId] = useState<string>("");
  const { toastError } = useAppToast();

  useEffect(() => {
    const id = localStorage.getItem("userId");

    if (!id) {
      toastError("Failed to get your Spotify ID.", {
        id: "failed-retrieving-userId",
      });
      return;
    }

    setUserId(id);
  }, [toastError]);
  return userId;
}

export default function PlaylistContent() {
  const userId = useUserId();
  const params = useParams<{ playlist_id: string }>();

  const searchParams = useSearchParams();

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
    playlist_id,
    userId,
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

  const handleNotIsOwnedCardClick = () => {
    return null;
  };

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

  return (
    <div className="mx-6 mb-10 flex min-h-screen flex-col items-center justify-center gap-2 border-none md:mx-8 lg:mx-10">
      {playlistName && (
        <h1 className="mb-4 text-center text-2xl font-semibold text-gray-800 md:text-3xl lg:text-4xl dark:text-gray-200">
          {playlistName}
          <span className="mx-auto mt-2 block h-1 w-[50%] rounded bg-purple-400 opacity-60" />
        </h1>
      )}
      {!isOwned && (
        <CreateNewPlaylistCard
          selectedTracksUri={Array.from(selectedTracksUri)}
          newPlaylistId=""
        />
      )}
      <InfoBanner isOwned={isOwned} />
      <div className="mt-5 grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
        <Button
          disabled={isFetchingNextPage}
          onClick={handleFetchNextPage}
          className="mt-5 flex w-32 items-center justify-center"
        >
          {isFetchingNextPage ? (
            <Spinner />
          ) : (
            <h1 className="text-sm font-semibold tracking-normal">Load More</h1>
          )}
        </Button>
      ) : null}
    </div>
  );
}
