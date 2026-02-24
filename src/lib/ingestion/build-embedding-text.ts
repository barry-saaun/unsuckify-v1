import type { SanatisedMusicData } from "./group-lastfm-data";

export function buildEmbeddingText(data: SanatisedMusicData): string {
  const parts: string[] = [];

  // Core identity
  parts.push(`Track: ${data.track}`);
  parts.push(`Artist: ${data.artist}`);
  parts.push(`Album: ${data.album}`);

  // Tags
  if (data.trackTags.length > 0)
    parts.push(`Track Tags: ${data.trackTags.join(", ")}`);

  if (data.artistTags.length > 0)
    parts.push(`Artist Tags: ${data.artistTags.join(", ")}`);

  // Context (lower priority)
  if (data.similarArtists.length > 0) {
    parts.push(`Similar Artists: ${data.similarArtists.join(", ")}`);
  }

  return parts.join("\n");
}
