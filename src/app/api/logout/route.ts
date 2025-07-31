import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });

  const keys = ["access_token", "expires_at", "refresh_token", "userId"];

  for (const key of keys) {
    response.cookies.set(key, "", { maxAge: -1, path: "/" });
  }

  return response;
}
