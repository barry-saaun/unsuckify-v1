import { meta } from "zod";
import type {
  LastFmArtistSimilarResponse,
  LastFmArtistTopTagsResponse,
  LastFmGetTrackInfoResponse,
} from "../music/types";
import { buildEmbeddingText } from "./build-embedding-text";
import { generateEmbedding } from "./generate-embedding";
import { groupLastFmData, type SanatisedMusicData } from "./group-lastfm-data";
import { buildSongKey } from "./sanitise";

export interface PreparedSong {
  songKey: string;
  embeddingText: string;
  embedding: number[];
  metadata: SanatisedMusicData;
  usage: { tokens: number };
}

export async function prepareSongForEmbedding(params: {
  trackInfo: LastFmGetTrackInfoResponse;
  artistTopTags: LastFmArtistTopTagsResponse;
  artistSimilar: LastFmArtistSimilarResponse;
}): Promise<PreparedSong> {
  const metadata = groupLastFmData(params);
  const embeddingText = buildEmbeddingText(metadata);

  // Stable, lowercase key for deduplication + DB lookups
  const songKey = buildSongKey(metadata.artist, metadata.track);

  const { embedding, usage } = await generateEmbedding(embeddingText);

  return {
    songKey,
    embeddingText,
    embedding,
    metadata,
    usage,
  };
}
