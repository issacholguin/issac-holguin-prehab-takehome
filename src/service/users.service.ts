import { db } from "../config/database";
import { UserInsert, users } from "../db/schema";
import { eq } from "drizzle-orm";

export const createUser = async (user: UserInsert) => {
  const query = db.insert(users).values(user).returning();
  const createdUser = await query;
  return createdUser;
};

export const getUserByUsername = async (username: string) => {
  const query = db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  const [user] = await query;
  return user;
};

export const getUserById = async (id: number) => {
  const query = db.select().from(users).where(eq(users.id, id));
  const user = await query;
  return user;
};
