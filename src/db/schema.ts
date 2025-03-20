import { sqliteTable as table } from "drizzle-orm/sqlite-core";
import * as t from "drizzle-orm/sqlite-core";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = table(
  "users",
  {
    id: t.int("id").primaryKey({ autoIncrement: true }),
    username: t.text("username").notNull().unique(),
    password: t.text("password").notNull(),
  }
  // SQLITE by default indexes on .unique() fields.
  // (table) => [
  //   t.uniqueIndex("username_idx").on(table.username),
  // ]
);

export const usersSelectSchema = createSelectSchema(users);
export const usersInsertSchema = createInsertSchema(users, {
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});
