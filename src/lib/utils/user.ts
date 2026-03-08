import { type TPushRecommendationsInput } from "~/types";
import { type TRPCCtxType } from "~/server/api/trpc";
import { users } from "~/server/db/schema";

export async function ensureUserExistence({
  input,
  ctx,
}: {
  input: TPushRecommendationsInput;
  ctx: TRPCCtxType;
}) {
  if (!input.userId) {
    return;
  }
  await ctx.db.insert(users).values({ id: input.userId }).onConflictDoNothing();
}
