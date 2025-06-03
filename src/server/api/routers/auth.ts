import { createTRPCRouter, publicProcedure } from "../trpc";
import { cookies } from "next/headers";

export const authRouter = createTRPCRouter({
  check: publicProcedure.query(async () => {
    const cookieStore = await cookies();
    const isAuthenticated = cookieStore.has("access_token");

    return { isAuthenticated };
  }),

  logout: publicProcedure.mutation(async () => {
    const cookieStore = await cookies();
    const keys = ["access_token", "expires_at", "refresh_token", "userId"];

    // Remove each cookie
    for (const key of keys) {
      cookieStore.set(key, "", { maxAge: -1, path: "/" });
    }

    // Optionally, return a message
    return { success: true };
  }),
});
