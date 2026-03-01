"use server";

import axios, { type AxiosError } from "axios";
import { env } from "~/env";
import { fetchLastFmData, lastFmApi } from "~/lib/music/lastfm";
import { tryCatch } from "~/lib/utils/try-catch";

type SerializableError = {
  name?: string;
  message: string;
  code?: string;
  stack?: string;
  axios?: {
    status?: number;
    statusText?: string;
    data?: unknown;
    headers?: Record<string, string>;
  };
};

function safeSerializeError(error: unknown): SerializableError {
  const base: SerializableError = {
    message: error instanceof Error ? error.message : String(error),
  };

  if (error instanceof Error) {
    base.name = error.name;
    base.stack = error.stack;
  }

  // TRPCError often has a `code` field
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  ) {
    base.code = (error as { code: string }).code;
  }

  if (axios.isAxiosError(error)) {
    const err = error as AxiosError;
    base.code =
      base.code ?? (typeof err.code === "string" ? err.code : undefined);
    base.axios = {
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      headers: err.response?.headers
        ? Object.fromEntries(
            Object.entries(err.response.headers).map(([k, v]) => [
              k,
              String(v),
            ]),
          )
        : undefined,
    };
  }

  return base;
}

type LastFmEndpoint =
  | "track.getinfo"
  | "artist.gettoptags"
  | "artist.getsimilar";

async function lastFmRawRequest(params: {
  endpoint: LastFmEndpoint;
  query: Record<string, string>;
  timeoutMs?: number;
}) {
  const startedAt = Date.now();
  const baseURL = "http://ws.audioscrobbler.com/2.0/";

  try {
    const response = await axios.get(baseURL, {
      params: {
        method: params.endpoint,
        ...params.query,
        api_key: env.LAST_FM,
        format: "json",
      },
      timeout: params.timeoutMs ?? 20_000,
      // Last.fm will often return a 200 with `{ error, message }` in the body.
      validateStatus: () => true,
    });

    const tookMs = Date.now() - startedAt;

    return {
      ok: true as const,
      tookMs,
      request: {
        baseURL,
        endpoint: params.endpoint,
        query: params.query,
        timeoutMs: params.timeoutMs ?? 20_000,
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(
          Object.entries(response.headers).map(([k, v]) => [k, String(v)]),
        ),
        data: response.data as unknown,
      },
      lastFmBodyError:
        typeof response.data === "object" &&
        response.data !== null &&
        "error" in response.data
          ? (response.data as { error?: unknown }).error
          : null,
    };
  } catch (error) {
    const tookMs = Date.now() - startedAt;
    return {
      ok: false as const,
      tookMs,
      request: {
        baseURL,
        endpoint: params.endpoint,
        query: params.query,
        timeoutMs: params.timeoutMs ?? 20_000,
      },
      error: safeSerializeError(error),
    };
  }
}

export async function testTrackInfo(artist: string, track: string) {
  const startedAt = Date.now();
  const { data, error } = await tryCatch(
    lastFmApi.getTrackInfo({ artist, track }),
  );
  const tookMs = Date.now() - startedAt;
  return {
    ok: !error,
    tookMs,
    data,
    error: error ? safeSerializeError(error) : null,
  };
}

export async function testArtistTopTags(artist: string) {
  const startedAt = Date.now();
  const { data, error } = await tryCatch(
    lastFmApi.getArtistTopTags({ artist }),
  );
  const tookMs = Date.now() - startedAt;
  return {
    ok: !error,
    tookMs,
    data,
    error: error ? safeSerializeError(error) : null,
  };
}

export async function testArtistSimilar(artist: string) {
  const startedAt = Date.now();
  const { data, error } = await tryCatch(
    lastFmApi.getArtistSimilar({ artist }),
  );
  const tookMs = Date.now() - startedAt;
  return {
    ok: !error,
    tookMs,
    data,
    error: error ? safeSerializeError(error) : null,
  };
}

export async function testFetchLastFmData(artist: string, track: string) {
  const startedAt = Date.now();
  const { data, error } = await tryCatch(fetchLastFmData(artist, track));
  const tookMs = Date.now() - startedAt;
  return {
    ok: !error,
    tookMs,
    data,
    error: error ? safeSerializeError(error) : null,
  };
}

export async function testTrackInfoRaw(
  artist: string,
  track: string,
  timeoutMs?: number,
) {
  return await lastFmRawRequest({
    endpoint: "track.getinfo",
    query: { artist, track },
    timeoutMs,
  });
}

export async function testArtistTopTagsRaw(artist: string, timeoutMs?: number) {
  return await lastFmRawRequest({
    endpoint: "artist.gettoptags",
    query: { artist },
    timeoutMs,
  });
}

export async function testArtistSimilarRaw(artist: string, timeoutMs?: number) {
  return await lastFmRawRequest({
    endpoint: "artist.getsimilar",
    query: { artist },
    timeoutMs,
  });
}
