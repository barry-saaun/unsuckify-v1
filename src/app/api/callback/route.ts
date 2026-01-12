import { redirect } from "next/navigation";
import axios from "axios";
import { env } from "~/env";

import { cookies } from "next/headers";
import { tryCatch } from "~/lib/try-catch";
import { assertError } from "~/lib/utils";

const SPOTIFY_CLIENT_ID = env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = env.SPOTIFY_CLIENT_SECRET;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  console.log(`[callback] ${JSON.stringify(searchParams)}`);

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const storedState = (await cookies()).get("spotify-auth-state")?.value;

  if (!state || !storedState || state !== storedState) {
    redirect("/?error=state_mismatch");
  }

  if (error) {
    return Response.json({ error });
  }

  const tokenEndpoint = "https://accounts.spotify.com/api/token";
  const credentials = Buffer.from(
    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`,
  ).toString("base64");

  const reqUrl = new URL(req.url);
  let baseUrl = `${reqUrl.protocol}//${reqUrl.host}`;

  // Convert localhost to 127.0.0.1 for Spotify compatibility
  if (baseUrl.includes("localhost")) {
    baseUrl = baseUrl.replace("localhost", "127.0.0.1");
  }

  const spotifyRedirectUri = `${baseUrl}/api/callback`;

  const { data: tokenData, error: tokenError } = await tryCatch(
    axios({
      url: tokenEndpoint,
      method: "post",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      data: new URLSearchParams({
        code: code ?? "",
        redirect_uri: spotifyRedirectUri,
        grant_type: "authorization_code",
      }).toString(),
    }),
  );

  if (tokenError || !tokenData) {
    return assertError("Failed to get token from Spotify", 400);
  }

  const { access_token, expires_in, refresh_token } = tokenData.data;

  const cookiesData: Record<string, string> = {
    access_token,
    expires_at: String(Date.now() + expires_in * 1000),
    refresh_token,
  };

  const cookiesStore = await cookies();

  for (const [key, value] of Object.entries(cookiesData)) {
    cookiesStore.set(key, value ?? "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: expires_in,
      path: "/",
    });
  }

  redirect("/dashboard");
}
