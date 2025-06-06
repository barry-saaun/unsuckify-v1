import { z } from "zod";

export const UsersPlaylistMetadataSchema = z.object({
  id: z.string(),
  description: z.string(),
  url: z.string(),
  display_name: z.string(),
  total: z.number(),
  name: z.string(),
});

export type UsersPlaylistMetadata = z.infer<typeof UsersPlaylistMetadataSchema>;

export type BreakpointValues = {
  DEFAULT: string;
  SM: string;
  MD: string;
  LG: string;
};

export type OffsetLimitParams = {
  offset: string | number;
  limit: string | number;
};

export type ModifiedDataType = {
  album?: string;
  artists?: string;
  track?: string;
}[];

export type TrackDescriptorSummaryResType = Record<
  "emotional_tones" | "genres" | "instrumentation" | "rhythm" | "themes",
  string[]
>;

export type PaginatedQueryKeyType = [string, { playlist_id: string }];

export type ScoredMemberType = {
  score: number;
  member: string;
};

export type PaginatedRecommendationsType = {
  data: string[];
  currentPage: number;
  nextPage: number | null;
  total: number;
};

export type GetTracksReturnType = {
  tracks: string[];
  hasMore: boolean;
  hasMoreInCurrentBatch: boolean;
  nextBatch: number | null;
};
