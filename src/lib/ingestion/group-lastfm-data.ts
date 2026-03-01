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
  similarArtists: string[];
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

  // Guard: ensure track object exists and has required fields.
  // fetchLastFmData should have validated this, but we defend here anyway.
  if (
    !track ||
    typeof track !== "object" ||
    !track.name ||
    typeof track.name !== "string"
  ) {
    throw new Error(
      `[groupLastFmData] Invalid track structure: missing or invalid track.name`,
    );
  }

  if (!track.artist || typeof track.artist !== "object" || !track.artist.name) {
    throw new Error(
      `[groupLastFmData] Invalid track structure: missing or invalid track.artist.name`,
    );
  }

  // Extract and normalise tags
  const trackTags = normaliseTags(track.toptags?.tag || []).slice(0, maxTags);

  // Extract and normalise artist tags (sorted by count)
  const artistTags = normaliseTags(
    (artistTopTags.toptags?.tag || []).sort(
      (a, b) => (b.count || 0) - (a.count || 0),
    ),
  ).slice(0, maxTags);

  // Extract similar artists (sorted by match score)
  const similarArtists = (artistSimilar.similarartists?.artist || [])
    .sort((a, b) => parseFloat(b.match || "0") - parseFloat(a.match || "0"))
    .slice(0, maxSimilar)
    .map((a) => normaliseArtistName(a.name));

  return {
    track: (track.name || "").trim(),
    artist: normaliseArtistName(track.artist.name),
    album: track.album?.title
      ? (track.album.title as string).trim()
      : "Unknown",
    trackTags,
    artistTags,
    similarArtists,
  };
}
