import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { artists } from "~/server/db/schema";
import { normaliseArtistName, normaliseTags } from "../ingestion/sanitise";
import { lastFmApi } from "../music/lastfm";

const CACHE_TTL_DAYS = 60;
const MAX_TAGS = 5;
const MAX_SIMILAR = 5;

export interface CachedArtistData {
  topTags: Array<{ name: string; count: number; url?: string }>;
  similarArtists: Array<{ name: string; match?: string; url?: string }>;
}

export interface ArtistData extends CachedArtistData {}

export async function getCachedArtist(
  name: string,
): Promise<CachedArtistData | null> {
  const row = await db
    .select({
      topTags: artists.topTags,
      topTagsData: artists.topTagsData,
      similarArtists: artists.similarArtists,
      similarArtistsData: artists.similarArtistsData,
      lastFetched: artists.lastFetched,
    })
    .from(artists)
    .where(eq(artists.name, name))
    .limit(1);

  if (row.length === 0) return null;

  const {
    topTags,
    topTagsData,
    similarArtists,
    similarArtistsData,
    lastFetched,
  } = row[0]!;

  if (isStale(lastFetched)) return null;

  // If this row was created before we stored structured cache, refetch once
  // to backfill counts/match scores.
  const structuredHasAny =
    (topTagsData?.length ?? 0) > 0 || (similarArtistsData?.length ?? 0) > 0;
  const legacyHasAny =
    (topTags?.length ?? 0) > 0 || (similarArtists?.length ?? 0) > 0;
  if (!structuredHasAny && legacyHasAny) return null;

  return { topTags: topTagsData, similarArtists: similarArtistsData };
}

export async function setCachedArtist(name: string, data: CachedArtistData) {
  await db
    .insert(artists)
    .values({
      name,
      // Keep legacy columns populated for easy inspection/queries
      topTags: data.topTags.map((t) => t.name),
      topTagsData: data.topTags,
      similarArtists: data.similarArtists.map((a) => a.name),
      similarArtistsData: data.similarArtists,
      lastFetched: new Date(),
    })
    .onConflictDoUpdate({
      target: artists.name,
      set: {
        topTags: data.topTags.map((t) => t.name),
        topTagsData: data.topTags,
        similarArtists: data.similarArtists.map((a) => a.name),
        similarArtistsData: data.similarArtists,
        lastFetched: new Date(),
      },
    });
}

export async function fetchArtistData(
  rawArtistName: string,
): Promise<ArtistData> {
  const artist = normaliseArtistName(rawArtistName);

  // --- Cache Hit ---
  const cached = await getCachedArtist(artist);

  if (cached) {
    console.log(`[artist-cache] HIT for "${artist}"`);
    return cached;
  }
  console.log(`[artist-cache] MISS for "${artist}" — fetching from Last.fm`);

  const [topTagsRes, similarRes] = await Promise.all([
    lastFmApi.getArtistTopTags({ artist }),
    lastFmApi.getArtistSimilar({ artist }),
  ]);

  const topTags = normaliseTagObjects(
    (topTagsRes.toptags?.tag ?? []).sort(
      (a, b) => Number(b.count ?? 0) - Number(a.count ?? 0),
    ),
  ).slice(0, MAX_TAGS);

  const similarArtists = normaliseSimilarArtistObjects(
    (similarRes.similarartists?.artist ?? []).sort(
      (a, b) => parseFloat(b.match ?? "0") - parseFloat(a.match ?? "0"),
    ),
  ).slice(0, MAX_SIMILAR);

  const data: ArtistData = { topTags, similarArtists };

  void setCachedArtist(artist, data);

  return data;
}

function normaliseTagObjects(
  tags: Array<{ name: string; count?: number; url?: string }>,
): Array<{ name: string; count: number; url?: string }> {
  const seen = new Map<string, { name: string; count: number; url?: string }>();

  for (const tag of tags) {
    const [clean] = normaliseTags([{ name: tag.name }]);
    if (!clean) continue;

    const count = Number(tag.count ?? 0);
    const prev = seen.get(clean);

    if (!prev || count > prev.count) {
      seen.set(clean, {
        name: clean,
        count: Number.isFinite(count) ? count : 0,
        url: tag.url,
      });
    }
  }

  return Array.from(seen.values()).sort((a, b) => b.count - a.count);
}

function normaliseSimilarArtistObjects(
  artistsInput: Array<{ name: string; match?: string; url?: string }>,
): Array<{ name: string; match?: string; url?: string }> {
  const seen = new Map<
    string,
    { name: string; match?: string; url?: string }
  >();

  for (const a of artistsInput) {
    const name = normaliseArtistName(a.name);
    if (!name) continue;

    const matchNum = parseFloat(a.match ?? "0");
    const prev = seen.get(name);
    const prevNum = prev ? parseFloat(prev.match ?? "0") : -1;

    if (!prev || matchNum > prevNum) {
      seen.set(name, { name, match: a.match, url: a.url });
    }
  }

  return Array.from(seen.values()).sort(
    (a, b) => parseFloat(b.match ?? "0") - parseFloat(a.match ?? "0"),
  );
}

function isStale(lastFetched: Date): boolean {
  const ttlMs = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - lastFetched.getTime() > ttlMs;
}
