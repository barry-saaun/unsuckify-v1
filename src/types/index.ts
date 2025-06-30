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
