import { skipToken } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "~/trpc/react";

const MAX_INPUT_SIZE = 300;
const SAFE_INPUT_SIZE = 120;

export default function useRecommendationsWithThreshold({
  playlistData,
}: {
  playlistData: string[] | undefined;
}) {
  const inputSize = playlistData ? playlistData.length : 0;

  const isSmallInput = inputSize <= SAFE_INPUT_SIZE;
  const isLargeInputToQuery =
    inputSize > SAFE_INPUT_SIZE && inputSize <= MAX_INPUT_SIZE;
  const isTooLargeInput = inputSize > MAX_INPUT_SIZE;

  const queryResult = api.track.getRecommendations.useQuery(
    playlistData ?? skipToken,
    {
      enabled: isSmallInput && !!playlistData,
      staleTime: 86400 * 1000,
      retry: false,
    },
  );

  const mutation = api.track.getRecommendationsMutate.useMutation();

  useEffect(() => {
    if (
      isLargeInputToQuery &&
      playlistData &&
      !mutation.data &&
      !mutation.isPending
    ) {
      mutation.mutate(playlistData);
    }
  }, [isLargeInputToQuery, playlistData, mutation]);

  const rec_tracks = queryResult.data ?? mutation.data;
  const isLoadingRecommendations = queryResult.isLoading ?? mutation.isPending;
  const recommendationsError = queryResult.error ?? mutation.error;

  return {
    data: isTooLargeInput ? null : rec_tracks,
    isLoading: isLoadingRecommendations,
    error: isTooLargeInput
      ? {
          code: "PAYLOAD_TOO_LARGE" as const,
          message: `Sorry! We're currently only supporting up to ${MAX_INPUT_SIZE} songs per playlist.`,
        }
      : recommendationsError,
  };
}
