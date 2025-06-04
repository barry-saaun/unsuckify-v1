import { spotifyApi } from "~/lib/spotify";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { cookies } from "next/headers";

export const userRouter = createTRPCRouter({
  getCurrentUserProfile: publicProcedure.query(async () => {
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
});
