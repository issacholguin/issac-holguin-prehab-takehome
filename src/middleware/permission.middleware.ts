import { Request, Response, NextFunction } from "express";
import { exercises } from "../db/schema";
import { AppError } from "../types/express/error";
import { getExerciseById } from "../service/exercises.service";

/**
 * Permission rules for exercise modifications
 */
export interface ExercisePermissionRules {
  /**
   * If true, any authenticated user can modify public exercises
   * If false, only the owner can modify public exercises
   */
  anyoneCanModifyPublicExercises: boolean;

  /**
   * If true, users can modify exercises they don't own (subject to public/private rules)
   * If false, users can only modify their own exercises
   */
  allowNonOwnerModification: boolean;
}

/**
 * Creates a middleware to check if a user has permission to modify an exercise
 * based on ownership and public/private status
 */
export const updateExercisePermissionGuard = (
  rules: ExercisePermissionRules
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const exerciseId = parseInt(req.params.id);
      const userId = req.user?.userId;

      const exercise = await getExerciseById(exerciseId);

      if (!exercise) {
        throw new AppError("Exercise not found", 404);
      }

      const isOwner = exercise.userId === userId;
      const isPublicExercise = exercise.isPublic;

      // Early return if user is the owner - owners can always modify their exercises
      if (isOwner) {
        next("User is the owner");
        return;
      }

      // Non-owner permissions
      // Getting here implies that the exercise is not owned by the user
      if (!rules.allowNonOwnerModification) {
        throw new AppError("Only the owner can modify this exercise", 403);
      }

      // Public exercise permissions
      if (isPublicExercise && !rules.anyoneCanModifyPublicExercises) {
        throw new AppError(
          "Public exercises are not allowed to be modified",
          403
        );
      }

      // Private exercise permissions - non-owners can never modify private exercises
      if (!isPublicExercise && rules.anyoneCanModifyPublicExercises) {
        throw new AppError(
          "Only the owner can modify their own non-public exercises",
          403
        );
      }

      next("All checks passed, user is allowed to modify exercise");
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
        return;
      }
      next(new AppError("Permission check failed", 500));
    }
  };
};
