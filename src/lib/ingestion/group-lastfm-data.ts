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
    track: track.name.trim(),
    artist: normaliseArtistName(track.artist.name),
    album: track.album?.title.trim() || "Unknown",
    trackTags,
    artistTags,
    similarArtists,
  };
}
