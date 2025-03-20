import { db } from "../config/database";
import { UserInsert, User, users } from "../db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../utils/hash.utils";

export const createUser = async (
  user: UserInsert
): Promise<Omit<User, "password">> => {
  const hashedPassword = await hashPassword(user.password);
  user.password = hashedPassword;
  const query = db.insert(users).values(user).returning();
  const createdUser = await query;
  const { password, ...userWithoutPassword } = createdUser[0];
  return userWithoutPassword;
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
