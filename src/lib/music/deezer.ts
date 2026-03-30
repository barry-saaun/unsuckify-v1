import axios from "axios";
import { TRPCError } from "@trpc/server";
import { tryCatch } from "../utils/try-catch";
import type { DeezerSearchResponse, RawTrack } from "./types";

const deezerApiEndpoints = ["search"] as const;
type TDeezerApiEndpoints = (typeof deezerApiEndpoints)[number];

const deezerClient = axios.create({
  baseURL: "https://api.deezer.com",
});

const UNKNOWN = "Unknown" as const;

async function deezeFetch<T>(
  endpoint: TDeezerApiEndpoints,
  queryParams?: Record<string, string>,
) {
  const { data: response, error } = await tryCatch(
    deezerClient.get<T>(`/${endpoint}`, {
      params: {
        ...queryParams,
      },
    }),
  );

  if (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const responseData = error.response?.data as
        | { message?: string }
        | undefined;

      let code:
        | "UNAUTHORIZED"
        | "NOT_FOUND"
        | "BAD_REQUEST"
        | "INTERNAL_SERVER_ERROR" = "INTERNAL_SERVER_ERROR";

      if (status === 401) code = "UNAUTHORIZED";
      else if (status === 404) code = "NOT_FOUND";
      else if (status && status >= 400 && status < 500) code = "BAD_REQUEST";

      throw new TRPCError({
        code,
        message: responseData?.message ?? error.message,
        cause: error,
      });
    }

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unknown error occurred when contacting Deezer API.",
      cause: error,
    });
  }

  return response!.data;
}

export const deezerApi = {
  getTrackSearch: ({ artistName, trackName, albumName }: RawTrack) =>
    deezeFetch<DeezerSearchResponse>("search", {
      q:
        albumName === UNKNOWN
          ? `artist:"${artistName}" track:"${trackName}"`
          : `artist:"${artistName}" album:"${albumName}" track:"${trackName}"`,
    }),
};
