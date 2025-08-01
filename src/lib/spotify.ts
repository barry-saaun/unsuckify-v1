import {
  type SinglePlaylistResponse,
  type CurrentUsersProfileResponse,
  type ListOfCurrentUsersPlaylistsResponse,
  type TrackSearchResponse,
  type AddTracksToPlaylistResponse,
  type RemoveTracksFromPlaylistResponse,
  type CreatePlaylistResponse,
} from "spotify-api";
import queryString from "query-string";
import axios from "axios";
import { tryCatch } from "./try-catch";
import { cookies } from "next/headers";
import { TRPCError } from "@trpc/server";
import { type PlaylistTrackResponse } from "spotify-api";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type RequestBodyType = Record<string, JsonValue>;

async function spotifyFetch<T>(
  method: "GET" | "POST" | "DELETE",
  endpoint: string,
  params?: Record<string, string>,
  queryParams?: Record<string, number | string>,
  requestBody?: RequestBodyType,
) {
  const access_token = (await cookies()).get("access_token")?.value;

  if (!access_token) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No access token found. Please log in.",
    });
  }

  const baseUrl = "https://api.spotify.com/v1";
  let resolvedEndpoint = endpoint || "";

  if (params && endpoint) {
    resolvedEndpoint = Object.keys(params).reduce((url, key) => {
      return url.replace(`{${key}}`, params[key] ?? "");
    }, endpoint);
  }

  const queryParamsString = queryParams
    ? `?${queryString.stringify(queryParams)}`
    : "";

  const url = `${baseUrl}${resolvedEndpoint}${queryParamsString}`;

  const axiosConfig = {
    method,
    url,
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    ...(method === "POST" || (method === "DELETE" && requestBody)
      ? { data: requestBody }
      : {}),
  };

  const { data: res, error } = await tryCatch(axios.request<T>(axiosConfig));

  // if the AI hallucinate and return an incorrect object, just return null
  // and skip that error track
  if (error && endpoint === "/search") {
    return null;
  }

  if (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data;

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
        message:
          data?.error?.message ?? data?.error?.description ?? error.message,
        cause: error,
      });
    }
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unknown error occured when contacting Spotify API.",
      cause: error,
    });
  }

  return res.data;
}

export const spotifyApi = {
  getCurrentUsersProfile: () =>
    spotifyFetch<CurrentUsersProfileResponse>("GET", "/me"),
  getListOfCurrentUsersPlaylists: () =>
    spotifyFetch<ListOfCurrentUsersPlaylistsResponse>("GET", "/me/playlists"),
  getSinglePlaylistResponse: (playlist_id: string) =>
    spotifyFetch<SinglePlaylistResponse>("GET", "/playlists/{playlist_id}", {
      playlist_id,
    }),
  getPlaylistItems: ({
    playlist_id,
    offset,
    limit,
  }: {
    playlist_id: string;
    offset: number;
    limit: number;
  }) =>
    spotifyFetch<PlaylistTrackResponse>(
      "GET",
      "/playlists/{playlist_id}/tracks",
      { playlist_id },
      { offset, limit },
    ),
  searchForTrack: ({ q, type }: { q: string; type: string }) =>
    spotifyFetch<TrackSearchResponse>("GET", "/search", undefined, { q, type }),
  addTracksToPlaylist: ({
    playlist_id,
    requestBody,
  }: {
    playlist_id: string;
    requestBody: {
      uris: string[];
    };
  }) =>
    spotifyFetch<AddTracksToPlaylistResponse>(
      "POST",
      "/playlists/{playlist_id}/tracks",
      { playlist_id },
      undefined,
      requestBody,
    ),
  removePlaylistItems: ({
    playlist_id,
    requestBody,
  }: {
    playlist_id: string;
    requestBody: {
      tracks: {
        uri: string;
        snapshot_id: string;
      }[];
    };
  }) =>
    spotifyFetch<RemoveTracksFromPlaylistResponse>(
      "DELETE",
      "/playlists/{playlist_id}/tracks",
      { playlist_id },
      undefined,
      requestBody,
    ),
  createPlaylist: ({
    user_id,
    requestBody,
  }: {
    user_id: string;
    requestBody: {
      name: string;
      public: boolean;
      description?: string;
    };
  }) =>
    spotifyFetch<CreatePlaylistResponse>(
      "POST",
      "/users/{user_id}/playlists",
      {
        user_id,
      },
      undefined,
      requestBody,
    ),
};
