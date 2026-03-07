import axios from "axios";

const spotifyHttp = axios.create({
  baseURL: "https://api.spotify.com/v1",
});

export async function spotifyRequest<T>(
  accessToken: string,
  config: {
    method: "GET" | "POST" | "DELETE";
    url: string;
    params?: Record<string, string | number>;
    data?: unknown;
  },
): Promise<T> {
  const response = await spotifyHttp.request<T>({
    ...config,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  return response.data;
}
