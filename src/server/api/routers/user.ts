import { spotifyApi } from "~/lib/spotify";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { cookies } from "next/headers";

export const userRouter = createTRPCRouter({
  getCurrentUserProfile: publicProcedure.query(async () => {
    const profile = await spotifyApi.getCurrentUsersProfile();
    console.log("profile", profile);

    try {
      const serializedProfile = JSON.parse(JSON.stringify(profile));
      console.log(
        "profile (server-side, after JSON roundtrip):",
        serializedProfile,
      );
      // Optionally, compare profile with serializedProfile to see if anything was lost
    } catch (e) {
      console.error("Serialization error on server for profile:", e);
      // If this logs an error, you've found your culprit!
    }
    // --- END ADDITION ---

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
