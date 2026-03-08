import type { SanatisedMusicData } from "./group-lastfm-data";

export function buildEmbeddingText(data: SanatisedMusicData): string {
  const parts: string[] = [];

  // --- Core identity (highest priority) ---
  parts.push(`Track: ${data.track}`);
  parts.push(`Artist: ${data.artist}`);
  parts.push(`Album: ${data.album}`);

  // --- Track tags ---
  if (data.trackTags.length > 0) {
    parts.push(`Track Tags: ${data.trackTags.join(", ")}`);
  }

  // --- Artist tags (weighted via repetition) ---
  if (data.artistTagsWeighted.length > 0) {
    const repeated = data.artistTagsWeighted.flatMap((t) => {
      const repeatCount = weightTierFromCount(t.count);
      return Array(repeatCount).fill(t.name);
    });

    parts.push(`Artist Tags: ${repeated.join(", ")}`);
  } else if (data.artistTags.length > 0) {
    parts.push(`Artist Tags: ${data.artistTags.join(", ")}`);
  }

  // --- Similar artists (weighted via repetition) ---
  if (data.similarArtistsWeighted.length > 0) {
    const repeated = data.similarArtistsWeighted.flatMap((a) => {
      const repeatCount = weightTierFromMatch(a.match);
      return Array(repeatCount).fill(a.name);
    });

    parts.push(`Similar Artists: ${repeated.join(", ")}`);
  } else if (data.similarArtists.length > 0) {
    parts.push(`Similar Artists: ${data.similarArtists.join(", ")}`);
  }

  return parts.join("\n");
}

function weightTierFromCount(count: number): number {
  if (count >= 100) return 3;
  if (count >= 50) return 2;

  return 1;
}

function weightTierFromMatch(match: number): number {
  if (match >= 0.9) return 3;
  if (match >= 0.75) return 2;

  return 1;
}
