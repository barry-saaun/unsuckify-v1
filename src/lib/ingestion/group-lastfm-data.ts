import type {
  LastFmGetTrackInfoResponse,
  LastFmArtistSimilarResponse,
  LastFmArtistTopTagsResponse,
} from "../music/types";
import { normaliseArtistName, normaliseTags } from "./sanitise";

export type SanatisedMusicData = {
  track: string;
  artist: string;
  album: string;
  trackTags: string[];
  artistTags: string[];
  artistTagsWeighted: Array<{ name: string; count: number }>;
  similarArtists: string[];
  similarArtistsWeighted: Array<{ name: string; match: number }>;
};

export function groupLastFmData(params: {
  trackInfo: LastFmGetTrackInfoResponse;
  artistTopTags: LastFmArtistTopTagsResponse;
  artistSimilar: LastFmArtistSimilarResponse;
  maxTags?: number;
  maxSimilar?: number;
}): SanatisedMusicData {
  const {
    trackInfo,
    artistTopTags,
    artistSimilar,
    maxTags = 5,
    maxSimilar = 5,
  } = params;

  const track = trackInfo.track;

  // Extract and normalise tags
  const trackTags = normaliseTags(track.toptags?.tag || []).slice(0, maxTags);

  // Extract and normalise artist tags (sorted by count)
  const artistTagObjects = (artistTopTags.toptags?.tag || []).sort(
    (a, b) => Number(b.count || 0) - Number(a.count || 0),
  );
  const artistTagsWeighted = normaliseWeightedTags(artistTagObjects).slice(
    0,
    maxTags,
  );
  const artistTags = artistTagsWeighted.map((t) => t.name);

  // Extract similar artists (sorted by match score)
  const similarArtistObjects = (
    artistSimilar.similarartists?.artist || []
  ).sort((a, b) => parseFloat(b.match || "0") - parseFloat(a.match || "0"));
  const similarArtistsWeighted = normaliseWeightedSimilarArtists(
    similarArtistObjects,
  ).slice(0, maxSimilar);
  const similarArtists = similarArtistsWeighted.map((a) => a.name);

  return {
    track: track.name.trim(),
    artist: normaliseArtistName(track.artist.name),
    album: track.album?.title.trim() || "Unknown",
    trackTags,
    artistTags,
    artistTagsWeighted,
    similarArtists,
    similarArtistsWeighted,
  };
}

function normaliseWeightedTags(
  tags: Array<{ name: string; count: number }>,
): Array<{ name: string; count: number }> {
  const seen = new Map<string, { name: string; count: number }>();

  for (const tag of tags) {
    const [clean] = normaliseTags([{ name: tag.name }]);
    if (!clean) continue;

    const count = Number(tag.count ?? 0);
    const prev = seen.get(clean);

    if (!prev || count > prev.count) {
      seen.set(clean, {
        name: clean,
        count: Number.isFinite(count) ? count : 0,
      });
    }
  }

  return Array.from(seen.values()).sort((a, b) => b.count - a.count);
}

function normaliseWeightedSimilarArtists(
  artists: Array<{ name: string; match?: string }>,
): Array<{ name: string; match: number }> {
  const seen = new Map<string, { name: string; match: number }>();

  for (const a of artists) {
    const name = normaliseArtistName(a.name);
    if (!name) continue;

    const match = parseFloat(a.match ?? "0");
    const prev = seen.get(name);

    if (!prev || match > prev.match) {
      seen.set(name, { name, match: Number.isFinite(match) ? match : 0 });
    }
  }

  return Array.from(seen.values()).sort((a, b) => b.match - a.match);
}
