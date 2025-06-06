import { spotifyApi } from "~/lib/spotify";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { cookies } from "next/headers";
import type { UsersPlaylistMetadata } from "~/types";
import z from "zod";

export const userRouter = createTRPCRouter({
  getCurrentUserProfile: protectedProcedure.query(async () => {
    const profile = await spotifyApi.getCurrentUsersProfile();

    if (profile && typeof profile === "object" && "id" in profile) {
      const userId = profile.id;
      const cookieStore = await cookies();

      cookieStore.set("userId", userId, {
        httpOnly: true,
        secure: true,
        maxAge: 3600,
      });

      return profile;
    }

    return null;
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
          display_name: item.owner.display_name ?? "",
          total: item.tracks.total,
        }),
      );

      return formattedData;
    }

    return null;
  }),
  getPlaylist: protectedProcedure
    .input(
      z.object({
        playlist_id: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const p_data = await spotifyApi.getSinglePlaylistResponse(
        input.playlist_id,
      );

      return p_data;
    }),
});
