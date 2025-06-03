import { createTRPCRouter, publicProcedure } from "../trpc";
import { cookies } from "next/headers";

export const authRouter = createTRPCRouter({
  check: publicProcedure.query(async () => {
    const cookieStore = cookies();
    const isAuthenticated = (await cookieStore).has("access_token");

    return { isAuthenticated };
  }),
});
