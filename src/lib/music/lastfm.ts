import axios from "axios";
import queryString from "query-string";
import { env } from "~/env";
import { TRPCError } from "@trpc/server";
import { tryCatch } from "../try-catch";
import type { TopTagsResponse, TrackGetInfoResponse } from "./types";

const lastFmApiEndpoints = [
  "track.getinfo",
  "artists.gettoptags",
  "artists.getSimilar",
] as const;
type TLastFmApiEndpoints = (typeof lastFmApiEndpoints)[number];

const lastFmClient = axios.create({
  baseURL: "http://ws.audioscrobbler.com/2.0/",
});

async function lastFmFetch<T>(
  endpoint: TLastFmApiEndpoints,
  queryParams?: Record<string, string>,
) {
  const { data: response, error } = await tryCatch(
    lastFmClient.get<T>("", {
      params: {
        method: endpoint,
        ...queryParams,
        api_key: env.LAST_FM,
        format: "json",
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
      message: "Unknown error occurred when contacting Last.fm API.",
      cause: error,
    });
  }

  return response!.data;
}

export const lastFmApi = {
  getTrackInfo: ({ artist, track }: { artist: string; track: string }) =>
    lastFmFetch<TrackGetInfoResponse>("track.getinfo", { artist, track }),

  getArtistTopTag: ({ artist }: { artist: string }) =>
    lastFmFetch<TopTagsResponse>("artists.gettoptags", { artist }),
};
