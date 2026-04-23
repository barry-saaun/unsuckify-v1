import { spotifyApi } from "~/lib/music/spotify";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import z from "zod";

const UsersPlaylistMetadataSchema = z.object({
  id: z.string(),
  description: z.string(),
  url: z.string(),
  owner: z.string(),
  ownerId: z.string(),
  total: z.number(),
  name: z.string(),
});

type UsersPlaylistMetadata = z.infer<typeof UsersPlaylistMetadataSchema>;

export const userRouter = createTRPCRouter({
  getCurrentUserProfile: protectedProcedure.query(async () => {
    const profile = await spotifyApi.getCurrentUsersProfile();

    if (profile && typeof profile === "object" && "id" in profile) {
      return profile;
    }

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to load your profile data.",
    });
  }),
  getListOfCurrentUsersPlaylists: protectedProcedure.query(async () => {
    const playlists = await spotifyApi.getListOfCurrentUsersPlaylists();

    if (playlists && typeof playlists === "object") {
      const formattedData: UsersPlaylistMetadata[] = playlists.items.map(
        (item) => ({
          id: item.id,
          description: item.description ?? "",
          url: item.images?.slice().sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url ?? "",
          name: item.name,
          owner: item.owner.display_name ?? "",
          ownerId: item.owner.id ?? "",
          total: item.tracks.total,
        }),
      );

      return formattedData;
    }

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to load your playlists. Please try again later.",
    });
  }),
  // Dev-only: Get public playlists for a given user ID
  getUsersPublicPlaylists: protectedProcedure
    .input(z.object({ user_id: z.string() }))
    .query(async ({ input }) => {
      if (process.env.NODE_ENV !== "development") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "This endpoint is only available in development mode.",
        });
      }

      const playlists = await spotifyApi.getUsersPlaylists(input.user_id);

      if (playlists && typeof playlists === "object") {
        return playlists.items
          .filter((item) => item.public)
          .map((item) => ({
            id: item.id,
            label: item.name,
          }));
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to load playlists for this user.",
      });
    }),
});
