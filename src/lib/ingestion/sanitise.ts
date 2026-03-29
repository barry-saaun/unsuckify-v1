import { createHash } from "node:crypto";

export function normaliseTags(
  tags: Array<{ name?: string; count?: number }>,
): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const tag of tags) {
    if (!tag.name) continue;

    const clean = tag.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (clean && !seen.has(clean)) {
      seen.add(clean);
      normalized.push(clean);
    }
  }

  return normalized;
}

export function normaliseArtistName(name: string): string {
  return name.trim();
}

// Extracts the primary artist from a Spotify multi-artist string like
// "Elevation Worship & Tauren Wells" → "Elevation Worship"
export function extractPrimaryArtist(artist: string): string {
  return artist
    .split(/\s*[,&]\s*|\s+x\s+/i)[0]!
    .trim();
}

// Strips featured-artist credits from a Spotify track name like
// "Echo (feat. Tauren Wells)" → "Echo"
export function stripFeaturedArtist(track: string): string {
  return track
    .replace(/\s*[\(\[](feat|ft|featuring|with)\.?\s[^\)\]]*[\)\]]/gi, "")
    .replace(/\s*(feat|ft|featuring)\.?\s.*/i, "")
    .trim();
}

export function buildSongKey(artist: string, track: string): string {
  const raw = `${artist}::${track}`.toLowerCase().trim();
  // Return a deterministic hash (always safe ASCII)
  return createHash("sha256").update(raw).digest("hex");
}
