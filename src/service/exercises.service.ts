import { db } from "../config/database";
import { eq } from "drizzle-orm";
import { Exercise, ExerciseInsert, exercises } from "../db/schema";
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
