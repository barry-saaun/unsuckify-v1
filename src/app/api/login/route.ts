import { generateRandomString } from "~/lib/utils";
import { env } from "~/env";
import queryString from "query-string";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getBaseUrl } from "~/lib/utils/api";

const SPOTIFY_CLIENT_ID = env.SPOTIFY_CLIENT_ID;

export async function GET() {
  const state = generateRandomString(16);

  (await cookies()).set("spotify-auth-state", state, {
    httpOnly: true,
    path: "/",
    secure: true,
    maxAge: 600,
  });

  const scopes = [
    "playlist-read-private",
    "playlist-read-collaborative",
    "user-read-private",
    "user-read-email",
    "playlist-modify-public",
    "playlist-modify-private",
  ] as const;

  const scope = scopes.map((element) => element).join(" ");

  const spotifyRedirectUri = `${getBaseUrl()}/api/callback`;

  const apiBaseUrl = "https://accounts.spotify.com/authorize";
  const params = {
    response_type: "code",
    client_id: SPOTIFY_CLIENT_ID,
    scope,
    redirect_uri: spotifyRedirectUri,
    state,
  };

  const queryParamsString = queryString.stringify(params);

  const url = `${apiBaseUrl}?${queryParamsString}`;
  redirect(url);
}
