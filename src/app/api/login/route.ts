import { generateRandomString } from "~/lib/utils";
import { env } from "~/env";
import queryString from "query-string";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

const SPOTIFY_CLIENT_ID = env.SPOTIFY_CLIENT_ID;

export async function GET(req: Request) {
  const state = generateRandomString(16);

  (await cookies()).set("spotify-auth-state", state, {
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
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

  const reqUrl = new URL(req.url);
  let baseUrl = `${reqUrl.protocol}//${reqUrl.host}`;

  // Convert localhost to 127.0.0.1 for Spotify compatibility
  if (baseUrl.includes("localhost")) {
    baseUrl = baseUrl.replace("localhost", "127.0.0.1");
  }

  const spotifyRedirectUri = `${baseUrl}/api/callback`;
  console.log(
    "DEBUG: dynamically generated spotifyRedirectUri:",
    spotifyRedirectUri,
  );
  console.log("DEBUG: SPOTIFY_CLIENT_ID:", SPOTIFY_CLIENT_ID);

  const apiBaseUrl = "https://accounts.spotify.com/authorize";
  const params = {
    response_type: "code",
    client_id: SPOTIFY_CLIENT_ID,
    scope,
    redirect_uri: spotifyRedirectUri,
    state,
  };

  const queryParamsString = queryString.stringify(params);

  const authUrl = `${apiBaseUrl}?${queryParamsString}`;
  redirect(authUrl);
}
