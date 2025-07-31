import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { cookies } from "next/headers";
import { spotifyApi } from "~/lib/spotify";
import { allowedUsers } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import z from "zod";

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
