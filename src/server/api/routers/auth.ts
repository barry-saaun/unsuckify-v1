import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { cookies } from "next/headers";
import { spotifyApi } from "~/lib/spotify";

export const authRouter = createTRPCRouter({
  check: publicProcedure.query(async () => {
    const cookieStore = await cookies();
    const isAuthenticated = cookieStore.has("access_token");

    if (!isAuthenticated) {
      return { isAuthenticated: false };
    }

    await spotifyApi.getCurrentUsersProfile();

    return { isAuthenticated };
  }),

  logout: publicProcedure.mutation(async () => {
    // Optionally, return a message
    return { success: true };
  }),
});
