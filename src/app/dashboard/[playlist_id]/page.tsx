"use client";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import ErrorScreen from "~/components/error-screen";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
  const params = useParams<{ playlist_id: string }>();

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
  } = api.track.getRecommendations.useQuery(playlistData ?? skipToken, {
    enabled: !!playlistData,
    staleTime: 86400 * 1000,
  });

  const userId = useUserId();

  console.log("[playlist_id] userId: ", userId);

  // const {
  //   mutate,
  //   isPending: isPushingRecommendations,
  //   error: pushingRecommendationsError,
  // } = api.track.pushRecommendations.useMutation();

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

  // useEffect(() => {
  //   if (!playlist_id || !userId || isLoadingRecommendations || !rec_tracks) {
  //     return;
  //   }
  //
  //   if (
  //     Array.isArray(rec_tracks) &&
  //     rec_tracks.length === 0 &&
  //     !recommendationsError
  //   ) {
  //     toast.info("No recommendations found for this playlist.", {
  //       id: "no-rec-for-playlist",
  //     });
  //     return;
  //   }
  //
  //   mutate({ playlist_id, userId, recommendations: rec_tracks });
  //
  //   console.log(rec_tracks);
  // }, [
  //   isLoadingRecommendations,
  //   recommendationsError,
  //   rec_tracks,
  //   mutate,
  //   playlist_id,
  //   userId,
  // ]);

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

  // Handle loading states for either query
  if (
    isLoadingPlaylist ||
    isLoadingRecommendations ||
    isLoadingResolvedTracks
  ) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2">
        <div className="hungry-loader" />
        <h1 className="font-semibold">
          We&apos;re crunching your recommendations...
        </h1>
      </div>
    );
  }

  if (!playlistData) {
    console.error("No playlist data found.");
    return <ErrorScreen message="No playlist data found." />;
  }

  if (!rec_tracks) {
    console.error("No recommendation data found.");
    return <ErrorScreen message="No recommendation data found." />;
  }

  return <div>{JSON.stringify(resolvedTracks)}</div>;
}
