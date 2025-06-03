import { spotifyApi } from "~/lib/spotify";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  getCurrentUserProfile: publicProcedure.query(async () => {
    return await spotifyApi.getCurrentUsersProfile();
  }),
});
