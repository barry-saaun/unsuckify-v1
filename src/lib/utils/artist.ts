import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { artists } from "~/server/db/schema";
import { normaliseArtistName, normaliseTags } from "../ingestion/sanitise";
import { lastFmApi } from "../music/lastfm";

const CACHE_TTL_DAYS = 60;
const MAX_TAGS = 5;
const MAX_SIMILAR = 5;

export interface CachedArtistData {
  topTags: string[];
  similarArtists: string[];
}

export interface ArtistData extends CachedArtistData {}

export async function getCachedArtist(
  name: string,
): Promise<CachedArtistData | null> {
  const row = await db
    .select({
      topTags: artists.topTags,
      similarArtists: artists.similarArtists,
      lastFetched: artists.lastFetched,
    })
    .from(artists)
    .where(eq(artists.name, name))
    .limit(1);

  if (row.length === 0) return null;

  const { topTags, similarArtists, lastFetched } = row[0]!;

  if (isStale(lastFetched)) return null;

  return { topTags, similarArtists };
}

export async function setCachedArtist(name: string, data: CachedArtistData) {
  await db
    .insert(artists)
    .values({
      name,
      topTags: data.topTags,
      similarArtists: data.similarArtists,
      lastFetched: new Date(),
    })
    .onConflictDoUpdate({
      target: artists.name,
      set: {
        topTags: data.topTags,
        similarArtists: data.similarArtists,
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
  if (cached) return cached;

  const [topTagsRes, similarRes] = await Promise.all([
    lastFmApi.getArtistTopTags({ artist }),
    lastFmApi.getArtistSimilar({ artist }),
  ]);

  const topTags = normaliseTags(
    (topTagsRes.toptags?.tag ?? []).sort(
      (a, b) => (b.count ?? 0) - (a.count ?? 0),
    ),
  ).slice(0, MAX_TAGS);

  const similarArtists = (similarRes.similarartists?.artist ?? [])
    .sort((a, b) => parseFloat(b.match ?? "0") - parseFloat(a.match ?? "0"))
    .slice(0, MAX_SIMILAR)
    .map((a) => normaliseArtistName(a.name));

  const data: ArtistData = { topTags, similarArtists };

  void setCachedArtist(artist, data);

  return data;
}

function isStale(lastFetched: Date): boolean {
  const ttlMs = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - lastFetched.getTime() > ttlMs;
}
