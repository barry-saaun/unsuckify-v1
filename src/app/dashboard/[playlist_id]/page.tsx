"use client";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import ErrorScreen from "~/components/error-screen";
import { useEffect, useRef } from "react";
import type { TRecommendedTracks } from "~/types";
import { isDeepStrictEqual } from "util";

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

  const lastSentRef = useRef<TRecommendedTracks>(null);

  const { mutate } = api.track.pushRecommendations.useMutation();

  const userId = "31y3qs5dnfs6cyuivogbn5fgl3au";

  useEffect(() => {
    if (!rec_tracks) return;

    if (isDeepStrictEqual(lastSentRef.current, rec_tracks)) {
      return;
    }

    mutate({ playlistId: playlist_id, userId, recommendations: rec_tracks });
    lastSentRef.current = rec_tracks;
  }, [rec_tracks, playlist_id, mutate]);

  // Handle errors for either query
  if (playlistError) {
    return <ErrorScreen message={playlistError.message} />;
  }

  if (recommendationsError) {
    return <ErrorScreen message={recommendationsError.message} />;
  }

  // Handle loading states for either query
  if (isLoadingPlaylist || isLoadingRecommendations) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="hungry-loader" />
      </div>
    );
  }

  if (!playlistData) {
    console.error("No playlist data found.");
    return <ErrorScreen message="No playlist data found." />;
  }

  if (!rec_tracks) {
    console.error("No recommendation data found.");
  }

  return <div>{JSON.stringify(rec_tracks)}</div>;
}
