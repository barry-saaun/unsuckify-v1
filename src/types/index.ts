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

export const RecommendedTrackObjectSchema = z.object({
  track: z.string().describe("The title of the recommended track"),
  album: z.string().describe("The name of the album of the recommended tracks"),
  artists: z.string().describe("The name of artists of the recommended track"),
  year: z.number().describe("The year that the track was released."),
});

export type TRecommendedTrackObject = z.infer<
  typeof RecommendedTrackObjectSchema
>;

export const RecommendedTracksSchema = z.array(RecommendedTrackObjectSchema);

export type TRecommendedTracks = z.infer<typeof RecommendedTracksSchema>;

export const PushRecommendationsInputSchema = z.object({
  userId: z.string(),
  playlist_id: z.string(),
  recommendations: RecommendedTracksSchema,
});

export type TPushRecommendationsInput = z.infer<
  typeof PushRecommendationsInputSchema
>;

export type HandleRecommendationTracksReturn = {
  resolvedTracks: TRecommendedTracks;
  timeLeft: number | null;
  batchId: number | null;
  success: boolean;
};

export type TrackStatusType = "pending" | "added" | "removed" | "failed";

export const GetOrCreateRecommendationsSchema = z.object({
  userId: z.string(),
  playlist_id: z.string(),
  latestBatchInput: z
    .object({
      id: z.number(),
      userId: z.string().nullable(),
      playlistId: z.string().nullable(),
      generatedAt: z.date(),
    })
    .nullable()
    .optional(),
  newTracks: RecommendedTracksSchema.optional(),
});

export type TGetOrCreateRecommendations = z.infer<
  typeof GetOrCreateRecommendationsSchema
>;
