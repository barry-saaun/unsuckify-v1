import { z } from "zod";

export const UsersPlaylistMetadataSchema = z.object({
  id: z.string(),
  description: z.string(),
  url: z.string(),
  owner: z.string(),
  ownerId: z.string(),
  total: z.number(),
  name: z.string(),
});

export type UsersPlaylistMetadata = z.infer<typeof UsersPlaylistMetadataSchema>;

export const RecommendedTracksSchema = z.array(
  z.object({
    track: z.string().describe("The title of the recommended track"),
    album: z
      .string()
      .describe("The name of the album of the recommended tracks"),
    artists: z
      .string()
      .describe("The name of artists of the recommended track"),
  }),
);

export type TRecommendedTracks = z.infer<typeof RecommendedTracksSchema>;

export const PushRecommendationsInputSchema = z.object({
  userId: z.string(),
  playlist_id: z.string(),
  recommendations: RecommendedTracksSchema,
});

export type TPushRecommendationsInput = z.infer<
  typeof PushRecommendationsInputSchema
>;

export type HandleReccomendationsTracksReturn = {
  resolvedTracks: TRecommendedTracks;
  timeLeft: number | null;
};

export type TrackDescriptorSummaryResType = Record<
  "emotional_tones" | "genres" | "instrumentation" | "rhythm" | "themes",
  string[]
>;

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

export type ServerComponentProps = {
  searchParams: { [key: string]: string | string[] | undefined };
};
