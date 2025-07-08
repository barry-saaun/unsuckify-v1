"use client";
import { useParams, useSearchParams } from "next/navigation";
import ErrorScreen from "~/components/error-screen";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import LoadingMessages from "~/components/loading-messages";
import { Button } from "~/components/ui/button";
import Spinner from "~/components/spinner";
import InfoBanner from "~/components/info-banner";
import CreateNewPlaylistCard from "~/components/create-new-playlist-card";
import { useRecommendedInfTracks } from "~/hooks/useRecommendedInfTracks";
import RecommendedTrackCard from "~/components/recommended-track-card";

function useUserId() {
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const id = localStorage.getItem("userId");

    if (!id) {
      toast.error("Failed to get your Spotify ID.", {
        id: "failed-retrieving-userId",
      });
      return;
    }

    setUserId(id);
  }, []);
  return userId;
}

export default function PlaylistContent() {
  const userId = useUserId();
  const params = useParams<{ playlist_id: string }>();

  const searchParams = useSearchParams();

  const ownerId = searchParams.get("ownerId");

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
  } = useRecommendedInfTracks({ playlist_id, userId });

  const [selectedTracksUri, setSelectedTracksUri] = useState(
    new Set<string>(new Set()),
  );

  const handleFetchNextPage = async () => {
    await fetchNextPage();
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

  // return (
  //   <div className="flex min-h-screen w-full flex-col">
  //     <div className="flex flex-col">
  //       {data?.pages.map((page, i) => (
  //         <div key={`${i} + ${JSON.stringify(page)}`}>
  //           {page.items.map((item) => (
  //             <div key={item.id}>{item.track}</div>
  //           ))}
  //         </div>
  //       ))}
  //     </div>
  //     <button onClick={handleFetchNextPage}>Load More</button>
  //   </div>
  // );

  return (
    <div className="mx-auto flex min-h-screen flex-col items-center justify-center gap-2 border-none">
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
            />
          )),
        )}
      </div>
      {hasNextPage ? (
        <Button
          disabled={isFetchingNextPage}
          onClick={() => fetchNextPage()}
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
