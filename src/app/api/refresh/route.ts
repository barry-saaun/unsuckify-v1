import { refreshAccessToken } from "~/lib/auth/refresh-token";

export async function POST() {
  const success = await refreshAccessToken();

  if (!success) {
    return Response.json({ error: "Failed to refresh token" }, { status: 401 });
  }

  return Response.json({ success: true });
}
