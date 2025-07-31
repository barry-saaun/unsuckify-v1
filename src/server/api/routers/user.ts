import { spotifyApi } from "~/lib/spotify";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import type { UsersPlaylistMetadata } from "~/types";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { allowedUsers } from "~/server/db/schema";
import { eq } from "drizzle-orm";

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
          url: item.images?.[0]?.url ?? "",
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
  isUserAllowed: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db
        .select()
        .from(allowedUsers)
        .where(eq(allowedUsers.id, input.userId))
        .limit(1);

      return user.length > 0;
    }),
});
