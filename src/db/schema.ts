import { sqliteTable as table, index } from "drizzle-orm/sqlite-core";
import * as t from "drizzle-orm/sqlite-core";
import {
  createSelectSchema,
  createInsertSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";

/**
 * User schema
 */

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
  // do not pass an id, throw error if it is passed
  id: z
    .number()
    .optional()
    .refine((id) => id === undefined, {
      message: "Id is not allowed",
    }),
  username: z.string().min(3, { message: "Username is required" }).max(20, {
    message: "Username must be less than 20 characters",
  }),
  password: z.string().min(6, { message: "Password is required" }).max(100, {
    message: "Password must be less than 100 characters",
  }),
});
export const usersLoginSchema = usersInsertSchema.pick({
  username: true,
  password: true,
});

export type UserInsert = Omit<z.infer<typeof usersInsertSchema>, "id">;
export type UserLogin = z.infer<typeof usersLoginSchema>;

export type User = z.infer<typeof usersSelectSchema>;
export type UserWithoutPassword = Omit<User, "password">;

/**
 * Exercise schema
 */

export const exercises = table(
  "exercises",
  {
    id: t.int("id").primaryKey({ autoIncrement: true }),
    name: t.text("name").notNull(),
    description: t.text("description").notNull(),
    difficulty: t.int("difficulty").notNull(),
    // SQLite does not have a boolean type, so we use 0 for false and 1 for true
    isPublic: t.integer("isPublic").notNull(),
    userId: t.int("userId").references(() => users.id),
  },
  (t) => [
    // Primary index combination for the most common filter pattern
    index("isPublic_userId_idx").on(t.isPublic, t.userId),

    // For filtering + sorting combinations
    index("isPublic_difficulty_idx").on(t.isPublic, t.difficulty),

    // Single column index for direct difficulty lookups and sorts
    index("difficulty_idx").on(t.difficulty),
  ]
);

export const exercisesSelectSchema = createSelectSchema(exercises, {
  isPublic: z.number().transform((val) => Boolean(val)),
});
export const exercisesInsertSchema = createInsertSchema(exercises, {
  userId: z.number().optional(),
  name: z.string().min(1, { message: "Name is required" }).max(100, {
    message: "Name must be less than 100 characters",
  }),
  description: z
    .string()
    .min(1, { message: "Description is required" })
    .max(1000, {
      message: "Description must be less than 1000 characters",
    }),
  difficulty: z
    .number()
    .min(1, { message: "Difficulty must be between 1 and 5" })
    .max(5, { message: "Difficulty must be between 1 and 5" }),
  isPublic: z
    .union([z.boolean(), z.number().min(0).max(1)])
    .transform((val) => (val === true || val === 1 ? 1 : 0)),
});
export const exercisesUpdateSchema = exercisesInsertSchema
  .pick({
    name: true,
    description: true,
    difficulty: true,
  })
  .partial();
export type ExerciseInsert = Omit<z.infer<typeof exercisesInsertSchema>, "id">;
export type ExerciseUpdate = Partial<ExerciseInsert>;
export type Exercise = z.infer<typeof exercisesSelectSchema>;
