import { db } from "../config/database";
import { eq } from "drizzle-orm";
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
    const query = db.insert(exercises).values(exercise).returning();
    const [result] = await query;
    return { ...result, isPublic: Boolean(result.isPublic) };
  } catch (error) {
    throw new AppError("Failed to create exercise", 500);
  }
};

export const getExerciseById = async (id: number): Promise<Exercise> => {
  try {
    const query = db.select().from(exercises).where(eq(exercises.id, id));
    const [result] = await query;
    return { ...result, isPublic: Boolean(result?.isPublic) };
  } catch (error) {
    throw new AppError("Failed to get exercise", 500);
  }
};

export const modifyExercise = async (
  id: string,
  exercise: ExerciseUpdate
): Promise<Exercise> => {
  try {
    const query = db
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
