export interface RawTrack {
  artistName: string;
  albumName?: string;
  trackName: string;
}

export interface LastFmGetTrackInfoResponse {
  track?: {
    name?: string;
    duration?: string;
    listeners?: string;
    playcount?: string;
    artist?: {
      name?: string;
      mbid?: string;
      url?: string;
    };
    album?: {
      artist?: string;
      title?: string;
      mbid?: string;
      url?: string;
    };
    toptags?: {
      tag?: Array<{
        name?: string;
        url?: string;
      }>;
    };
    wiki?: {
      published?: string;
      summary?: string;
      content?: string;
    };
  };
}

export interface LastFmArtistTopTagsResponse {
  toptags?: {
    tag?: Array<{
      name?: string;
      count?: number;
      url?: string;
    }>;
  };
}

export interface LastFmArtistSimilarResponse {
  similarartists?: {
    artist?: Array<{
      name?: string;
      match?: string;
      url?: string;
    }>;
  };
}

type EmbedJobSkipReason =
  | "not_found_on_lastfm"
  | "no_metadata"
  | "error"
  | "pre_ready";

export type EmbedJobResult =
  | {
      songKey: string;
      userId: string;
      outcome: "embedded";
      usage?: { tokens: number };
    }
  | {
      songKey: string;
      userId: string;
      outcome: "skipped";
      reason: EmbedJobSkipReason;
    };

export type EmbeddingCheckResult =
  | {
      skip: false;
    }
  | { skip: true; result: EmbedJobResult };
