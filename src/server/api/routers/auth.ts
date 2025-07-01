import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { cookies } from "next/headers";

export const authRouter = createTRPCRouter({
  check: publicProcedure.query(async () => {
    const cookieStore = await cookies();
    const isAuthenticated = cookieStore.has("access_token");

    if (!isAuthenticated) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Your session has expired.",
      });
    }

    return { isAuthenticated };
  }),

  logout: publicProcedure.mutation(async () => {
    // Optionally, return a message
    return { success: true };
  }),
});
