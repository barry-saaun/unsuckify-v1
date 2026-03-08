import { allowedUsers, type AllowedUsersSelectType } from "~/server/db/schema";
import { db } from "~/server/db";

const allowedUsersList: AllowedUsersSelectType[] = [] as const;

export async function addAllowedUsers() {
  try {
    await db
      .insert(allowedUsers)
      .values(allowedUsersList)
      .onConflictDoNothing()
      .execute();
  } catch (error) {
    throw new Error("Failed to insert user's id");
  }
}
