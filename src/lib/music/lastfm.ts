import axios from "axios";
import { env } from "~/env";
import { TRPCError } from "@trpc/server";
import { tryCatch } from "../utils/try-catch";
import type {
  LastFmArtistSimilarResponse,
  LastFmArtistTopTagsResponse,
  LastFmGetTrackInfoResponse,
} from "./types";
import { fetchArtistData } from "../utils/artist";

const lastFmApiEndpoints = [
  "track.getinfo",
  "artist.gettoptags",
  "artist.getsimilar",
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

  const payload: unknown = response!.data;

  // Last.fm frequently returns HTTP 200 with an error payload.
  // Example: { "error": 6, "message": "Track not found" }
  if (payload && typeof payload === "object" && "error" in payload) {
    const errorCodeRaw = (payload as { error?: unknown }).error;
    const errorCode =
      typeof errorCodeRaw === "number"
        ? errorCodeRaw
        : Number.parseInt(String(errorCodeRaw ?? ""), 10);

    const maybeMessage = (payload as { message?: unknown }).message;
    const message =
      typeof maybeMessage === "string"
        ? maybeMessage
        : "Last.fm returned an error";

    // ====== LAST FM DOCS SUCKKKKK!!!!!!!! ====

    // Map Last.fm error codes to TRPCError codes.
    // Reference: https://www.last.fm/api/errorcodes
    // "NOT_FOUND"            → skippable (song/resource doesn't exist)
    // "BAD_REQUEST"          → skippable (bad params / invalid method / deprecated)
    // "UNAUTHORIZED"         → fatal config issue, not skippable
    // "INTERNAL_SERVER_ERROR"→ transient, should retry
    let code:
      | "UNAUTHORIZED"
      | "NOT_FOUND"
      | "BAD_REQUEST"
      | "INTERNAL_SERVER_ERROR" = "INTERNAL_SERVER_ERROR";

    switch (errorCode) {
      // Skippable: the resource/track simply doesn't exist or can't be returned
      case 6: // Invalid parameters – missing required param (treat as bad request/skip)
      case 7: // Invalid resource specified – closest to "track not found"
      case 15: // Item not available for streaming
      case 20: // Not enough content
      case 21: // Not enough members
      case 22: // Not enough fans
      case 23: // Not enough neighbours
      case 25: // Radio station not found
        code = "NOT_FOUND";
        break;

      // Skippable: bad request shape, deprecated, or invalid method
      case 2: // Invalid service
      case 3: // Invalid method
      case 5: // Invalid format
      case 27: // Deprecated
        code = "BAD_REQUEST";
        break;

      // Auth / key issues – fatal config, not skippable
      case 4: // Authentication failed
      case 9: // Invalid session key
      case 10: // Invalid API key
      case 13: // Invalid method signature
      case 14: // Unauthorized token
      case 26: // API key suspended
        code = "UNAUTHORIZED";
        break;

      // Transient / retriable
      case 8: // Operation failed – backend error
      case 11: // Service offline
      case 16: // Temporarily unavailable
      case 29: // Rate limit exceeded
        code = "INTERNAL_SERVER_ERROR";
        break;

      default:
        code = "INTERNAL_SERVER_ERROR";
    }

    throw new TRPCError({
      code,
      message: `Last.fm error${Number.isFinite(errorCode) ? ` ${errorCode}` : ""}: ${message}`,
      cause: payload,
    });
  }

  return payload as T;
}

export const lastFmApi = {
  getTrackInfo: ({ artist, track }: { artist: string; track: string }) =>
    lastFmFetch<LastFmGetTrackInfoResponse>("track.getinfo", { artist, track }),

  getArtistTopTags: ({ artist }: { artist: string }) =>
    lastFmFetch<LastFmArtistTopTagsResponse>("artist.gettoptags", { artist }),

  getArtistSimilar: ({ artist }: { artist: string }) =>
    lastFmFetch<LastFmArtistSimilarResponse>("artist.getsimilar", { artist }),
};

export async function fetchLastFmData(artist: string, track: string) {
  const [trackInfo, artistData] = await Promise.all([
    lastFmApi.getTrackInfo({ artist, track }),
    fetchArtistData(artist),
  ]);

  // Validate that trackInfo has the required shape.
  // Last.fm can return a 200 with a valid JSON that just doesn't have the expected fields.
  // This guards against downstream TypeErrors when trying to access track.name, track.artist.name, etc.
  if (
    !trackInfo?.track?.name ||
    typeof trackInfo.track.name !== "string" ||
    !trackInfo.track.artist?.name ||
    typeof trackInfo.track.artist.name !== "string"
  ) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Track not found on Last.fm: ${artist} - ${track}`,
      cause: trackInfo,
    });
  }

  const artistTopTags: LastFmArtistTopTagsResponse = {
    toptags: {
      tag: artistData.topTags.map((name) => ({ name, count: 0, url: "" })),
    },
  };

  const artistSimilar: LastFmArtistSimilarResponse = {
    similarartists: {
      artist: artistData.similarArtists.map((name) => ({
        name,
        match: "1",
        url: "",
      })),
    },
  };

  return { trackInfo, artistTopTags, artistSimilar };
}
