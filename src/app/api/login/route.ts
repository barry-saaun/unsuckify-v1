import { generateRandomString } from "~/lib/utils";
import { env } from "~/env";
import queryString from "query-string";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

const SPOTIFY_CLIENT_ID = env.SPOTIFY_CLIENT_ID;
const NEXT_PUBLIC_SPOTIFY_REDIRECT_URI = env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI;

export async function GET() {
  const state = generateRandomString(16);

  (await cookies()).set("spotify-auth-state", state, {
    httpOnly: true,
    path: "/",
    secure: true,
    maxAge: 600,
  });

  const scope =
    "playlist-read-private playlist-read-collaborative user-read-private user-read-email playlist-modify-public playlist-modify-private";

  const baseUrl = "https://accounts.spotify.com/authorize";
  const params = {
    response_type: "code",
    client_id: SPOTIFY_CLIENT_ID,
    scope,
    redirect_uri: NEXT_PUBLIC_SPOTIFY_REDIRECT_URI,
    state,
  };

  const queryParamsString = queryString.stringify(params);

  const url = `${baseUrl}?${queryParamsString}`;
  redirect(url);
}
