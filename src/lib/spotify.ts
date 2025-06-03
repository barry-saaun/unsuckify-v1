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
import { assertError } from "./utils";
import { cookies } from "next/headers";

async function spotifyFetch<T>(
  endpoint: string,
  params?: Record<string, string>,
  queryParams?: Record<string, number | string>,
) {
  const access_token = (await cookies()).get("access_token")?.value;

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
    assertError("Error in fetching data from spotify API", 500);
  }

  return res?.data as T;
}

export const spotifyApi = {
  getCurrentUsersProfile: () =>
    spotifyFetch<CurrentUsersProfileResponse>("/me"),
};
