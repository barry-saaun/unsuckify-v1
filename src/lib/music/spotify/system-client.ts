/*
 * This client is for server-side calls. i.e., without having to
 * go through the normal tRPC procedure.
 *
 * One of the most crucial use for this: is the seeding process
 * */

import axios from "axios";
import { spotifyRequest } from "./base-client";
import type { PlaylistTrackResponse } from "spotify-api";

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getClientCredentialsToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const res = await axios.post(
    "https://accounts.spotify.com/api/token",
    new URLSearchParams({ grant_type: "client_credentials" }),
    {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
          ).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  cachedToken = res.data.access_token;
  tokenExpiresAt = Date.now() + res.data.expires_in * 1000;

  return cachedToken!;
}

export async function getPlaylistItemsSystem(params: {
  playlist_id: string;
  offset: number;
  limit: number;
}): Promise<PlaylistTrackResponse> {
  const token = await getClientCredentialsToken();

  return spotifyRequest(token, {
    method: "GET",
    url: `/playlists/${params.playlist_id}/tracks`,
    params: {
      offset: params.offset,
      limit: params.limit,
    },
  });
}
