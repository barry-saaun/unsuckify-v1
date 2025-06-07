import {
  type CreatePlaylistResponse,
  type SinglePlaylistResponse,
  type CurrentUsersProfileResponse,
  type ListOfCurrentUsersPlaylistsResponse,
  type PlaylistTrackResponse,
} from "spotify-api";
import queryString from "query-string";
import axios from "axios";
import { tryCatch } from "./try-catch";
import { cookies } from "next/headers";
import { TRPCError } from "@trpc/server";

async function spotifyFetch<T>(
  endpoint: string,
  params?: Record<string, string>,
  queryParams?: Record<string, number | string>,
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

  const { data: res, error } = await tryCatch(
    axios.get(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
    }),
  );

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

  return res?.data as T;
}

export const spotifyApi = {
  getCurrentUsersProfile: () =>
    spotifyFetch<CurrentUsersProfileResponse>("/me"),
  getListOfCurrentUsersPlaylists: () =>
    spotifyFetch<ListOfCurrentUsersPlaylistsResponse>("/me/playlists"),
  getSinglePlaylistResponse: (playlist_id: string) =>
    spotifyFetch<SinglePlaylistResponse>("/playlists/{playlist_id}", {
      playlist_id,
    }),
};
