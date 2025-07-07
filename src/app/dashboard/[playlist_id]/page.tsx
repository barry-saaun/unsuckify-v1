"use client";
import { useParams, useSearchParams } from "next/navigation";
import { api } from "~/trpc/react";
import ErrorScreen from "~/components/error-screen";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import LoadingMessages from "~/components/loading-messages";
import useRecommendationsWithThreshold from "~/hooks/useRecommendationsWithThreshold";

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
    data: playlistData,
    isLoading: isLoadingPlaylist,
    error: playlistError,
  } = api.playlist.getPlaylistItemsAll.useQuery(
    {
      playlist_id,
    },
    { staleTime: 86400 * 1000 },
  );

  const {
    data: rec_tracks,
    isLoading: isLoadingRecommendations,
    error: recommendationsError,
  } = useRecommendationsWithThreshold({
    playlistData: playlistData,
  });

  const {
    data: resolvedTracks,
    error: resolvingRecsError,
    isLoading: isLoadingResolvedTracks,
  } = api.track.getOrCreateRecommendations.useQuery(
    {
      userId,
      playlist_id,
      newTracks: rec_tracks!,
    },
    { enabled: !!rec_tracks && !!userId },
  );

  const batchId = resolvedTracks?.batchId;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingInfTracks,
  } = api.track.infiniteTracks.useInfiniteQuery(
    {
      limit: 2,
      batchId: batchId!,
    },
    { enabled: !!batchId, getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  const handleFetchNextPage = async () => {
    await fetchNextPage();
  };

  // Handle loading states for either query
  if (
    isLoadingPlaylist ||
    isLoadingRecommendations ||
    isLoadingResolvedTracks ||
    isLoadingInfTracks
  ) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="hungry-loader" />
        <LoadingMessages interval={1000} />
      </div>
    );
  }

  // Handle errors for either query
  if (playlistError) {
    return <ErrorScreen message={playlistError.message} />;
  }

  if (recommendationsError) {
    return <ErrorScreen message={recommendationsError.message} />;
  }

  if (resolvingRecsError) {
    return <ErrorScreen message={resolvingRecsError.message} />;
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
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex flex-col">
        {data?.pages.map((page, i) => (
          <div key={`${i} + ${JSON.stringify(page)}`}>
            {page.items.map((item) => (
              <div key={item.id}>{item.track}</div>
            ))}
          </div>
        ))}
      </div>
      <button onClick={async () => await fetchNextPage()}>Load More</button>
    </div>
  );
}
