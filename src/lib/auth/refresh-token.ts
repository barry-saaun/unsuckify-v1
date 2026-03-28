import { cookies } from "next/headers";
import axios from "axios";
import { env } from "~/env";

const ONE_WEEK = 7 * 24 * 60 * 60;

export async function refreshAccessToken(): Promise<boolean> {
  const cookieStore = await cookies();
  const refresh_token = cookieStore.get("refresh_token")?.value;

  if (!refresh_token) return false;

  const credentials = Buffer.from(
    `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`,
  ).toString("base64");

  let tokenData;
  try {
    const res = await axios({
      url: "https://accounts.spotify.com/api/token",
      method: "post",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      data: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token,
      }).toString(),
    });
    tokenData = res.data;
  } catch {
    return false;
  }

  const { access_token, expires_in, refresh_token: new_refresh_token } = tokenData;

  cookieStore.set("access_token", access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_WEEK,
    path: "/",
  });

  cookieStore.set("expires_at", String(Date.now() + expires_in * 1000), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_WEEK,
    path: "/",
  });

  if (new_refresh_token) {
    cookieStore.set("refresh_token", new_refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: ONE_WEEK,
      path: "/",
    });
  }

  return true;
}

export async function refreshIfNeeded(): Promise<void> {
  const cookieStore = await cookies();
  const expires_at = cookieStore.get("expires_at")?.value;

  if (!expires_at) return;

  const expiresAtMs = Number(expires_at);
  const isExpiredOrClose = Date.now() >= expiresAtMs - 60 * 1000;

  if (!isExpiredOrClose) return;

  await refreshAccessToken();
}
