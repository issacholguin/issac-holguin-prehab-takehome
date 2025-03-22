import { db } from "../config/database";
import { eq, and, asc, desc, like, or, SQL, sql } from "drizzle-orm";
import {
  Exercise,
  ExerciseInsert,
  exercises,
  ExerciseUpdate,
} from "../db/schema";
import { AppError } from "../types/express/error";

export const createExercise = async (
  exercise: ExerciseInsert
): Promise<Exercise> => {
  try {
    const query = db().insert(exercises).values(exercise).returning();
    const [result] = await query;
    return { ...result, isPublic: Boolean(result.isPublic) };
  } catch (error) {
    throw new AppError("Failed to create exercise", 500);
  }
};

export const getExerciseById = async (id: number): Promise<Exercise | null> => {
  try {
    const query = db().select().from(exercises).where(eq(exercises.id, id));
    const [result] = await query;
    if (result) {
      return { ...result, isPublic: Boolean(result.isPublic) };
    }
    return null;
  } catch (error) {
    throw new AppError("Failed to get exercise", 500);
  }
};

export const modifyExercise = async (
  id: string,
  exercise: ExerciseUpdate
): Promise<Exercise> => {
  try {
    const query = db()
      .update(exercises)
      .set(exercise)
      .where(eq(exercises.id, parseInt(id)))
      .returning();
    const [result] = await query;
    return { ...result, isPublic: Boolean(result.isPublic) };
  } catch (error) {
    throw new AppError("Failed to modify exercise", 500);
  }
};

export const deleteExercise = async (
  id: number
): Promise<{ message: string; id: number }> => {
  try {
    const query = db().delete(exercises).where(eq(exercises.id, id));
    await query;
    return {
      message: "Exercise deleted successfully",
      id,
    };
  } catch (error) {
    throw new AppError("Failed to delete exercise", 500);
  }
};

export type ExerciseFilters = {
  name?: string;
  description?: string;
  difficulty?: number;
  userId?: number;
  sortBy?: "difficulty";
  sortOrder?: "asc" | "desc";
};

export const listExercises = async (
  filters: ExerciseFilters
): Promise<Exercise[]> => {
  try {
    // Build base condition for public/private access
    const baseCondition = filters.userId
      ? // if we have a user id, we want to show public or the user's exercises
        or(eq(exercises.isPublic, 1), eq(exercises.userId, filters.userId))
      : // if we don't have a user id, we only want to show public exercises
        eq(exercises.isPublic, 1);

    // Build additional filter conditions
    const filterConditions: SQL<unknown>[] = [];

    if (filters.name) {
      filterConditions.push(
        like(sql`lower(${exercises.name})`, `%${filters.name.toLowerCase()}%`)
      );
    }
    if (filters.description) {
      filterConditions.push(
        like(
          sql`lower(${exercises.description})`,
          `%${filters.description.toLowerCase()}%`
        )
      );
    }
    if (filters.difficulty) {
      filterConditions.push(eq(exercises.difficulty, filters.difficulty));
    }

    // Build query combining base condition with filter conditions
    let query = db()
      .select()
      .from(exercises)
      .where(
        filterConditions.length > 0
          ? and(baseCondition, ...filterConditions)
          : baseCondition
      )
      .$dynamic();

    // Apply sorting if needed
    if (filters.sortBy === "difficulty") {
      query = query.orderBy(
        filters.sortOrder === "desc"
          ? desc(exercises.difficulty)
          : asc(exercises.difficulty)
      );
    }

    const results = await query;
    return results.map((result) => ({
      ...result,
      isPublic: Boolean(result.isPublic),
    }));
  } catch (error) {
    throw new AppError("Failed to list exercises", 500);
  }
};
