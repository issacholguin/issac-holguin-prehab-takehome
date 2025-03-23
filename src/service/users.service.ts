import { db } from "../config/database";
import { UserInsert, User, users } from "../db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../utils/hash.utils";
import { AppError } from "../types/express/error";

export const createUser = async (
  user: UserInsert
): Promise<Omit<User, "password">> => {
  try {
    const hashedPassword = await hashPassword(user.password);
    user.password = hashedPassword;
    const query = db().insert(users).values(user).returning();
    const createdUser = await query;
    const { password, ...userWithoutPassword } = createdUser[0];
    return userWithoutPassword;
  } catch (error) {
    throw new AppError("Failed to create user", 500);
  }
};

export const getUserByUsername = async (username: string) => {
  try {
    const query = db()
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    const [user] = await query;
    return user;
  } catch (error) {
    throw new AppError("Failed to get user by username", 500);
  }
};

export const getUserById = async (id: number): Promise<User> => {
  try {
    const query = db().select().from(users).where(eq(users.id, id));
    const [user] = await query;
    return user;
  } catch (error) {
    throw new AppError("Failed to get user by id", 500);
  }
};
