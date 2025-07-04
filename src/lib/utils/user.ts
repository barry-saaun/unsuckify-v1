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
  await ctx.db.insert(users).values({ id: input.userId }).onConflictDoNothing();
}
