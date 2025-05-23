import { RequestHandler, Router } from "express";
import {
  createExercise,
  deleteExercise,
  getExerciseById,
  listExercises,
  modifyExercise,
} from "../service/exercises.service";
import { AppError } from "../types/express/error";
import {
  authenticateToken,
  optionalAuthenticateToken,
} from "../middleware/auth.middleware";
import { validateSchema } from "../middleware/validate-schema.middleware";
import { exercisesInsertSchema, exercisesUpdateSchema } from "../db/schema";
import { updateExercisePermissionGuard } from "../middleware/permission.middleware";

const router = Router();

/**
 * @route GET /exercises
 * @desc List all public exercises with optional filtering and sorting
 * @access Public (with optional authentication)
 */
const listExercisesHandler: RequestHandler = async (req, res, next) => {
  try {
    const { name, description, difficulty, sortBy, sortOrder } = req.query;
    const userId = req.user?.userId;

    const exercises = await listExercises({
      name: name as string,
      description: description as string,
      difficulty: difficulty ? Number(difficulty) : undefined,
      userId,
      sortBy: sortBy === "difficulty" ? "difficulty" : undefined,
      sortOrder: sortOrder === "desc" ? "desc" : "asc",
    });

    res.status(200).json({
      exercises,
    });
  } catch (error) {
    if (error instanceof AppError) {
      next({
        status: error.status,
        message: error.message,
      });
      return;
    }
    next(error);
  }
};
router.get("/", optionalAuthenticateToken, listExercisesHandler);

/**
 * @route GET /exercises/:id
 * @desc Get a specific exercise
 * @access Public for public exercises, Private for private exercises (with optional authentication)
 */
const getExerciseHandler: RequestHandler = async (req, res, next) => {
  try {
    const exercise = await getExerciseById(Number(req.params.id));

    if (!exercise) {
      throw new AppError("Exercise not found", 404);
    }

    // Check if exercise is private and user is not the owner
    if (!exercise.isPublic && exercise.userId !== req.user?.userId) {
      throw new AppError(
        "You don't have permission to view this exercise",
        403
      );
    }

    res.status(200).json({
      exercise,
    });
  } catch (error) {
    if (error instanceof AppError) {
      next({
        status: error.status,
        message: error.message,
      });
      return;
    }
    next(error);
  }
};
router.get("/:id", optionalAuthenticateToken, getExerciseHandler);

// Protected routes (auth required)
router.use(authenticateToken);
/**
 * @route POST /exercises
 * @desc Create a new exercise
 * @access Private
 */
const createExerciseHandler: RequestHandler = async (req, res, next) => {
  try {
    const exercise = await createExercise({
      ...req.body,
      userId: req.user?.userId,
    });
    res.status(201).json({
      message: "Exercise created successfully",
      exercise,
    });
  } catch (error) {
    if (error instanceof AppError) {
      next({
        status: error.status,
        message: error.message,
      });
      return;
    }
    next(error);
  }
};
router.post("/", validateSchema(exercisesInsertSchema), createExerciseHandler);

/**
 * @route PATCH /exercises/:id
 * @desc Modify an exercise
 * @access Private - Based on permission rules:
 * - Owners can always modify their own exercises
 * - Public exercises can be modified by any authenticated user
 * - Private exercises can only be modified by their owner
 */
const modifyExerciseHandler: RequestHandler = async (req, res, next) => {
  try {
    const exercise = await modifyExercise(req.params.id, req.body);
    res.status(200).json({
      message: "Exercise modified successfully",
      exercise,
    });
  } catch (error) {
    if (error instanceof AppError) {
      next({
        status: error.status,
        message: error.message,
      });
      return;
    }
    next(error);
  }
};

// Apply permission guard before modifying exercise
router.patch(
  "/:id",
  validateSchema(exercisesUpdateSchema),
  updateExercisePermissionGuard({
    anyoneCanModifyPublicExercises: true, // Allow any authenticated user to modify public exercises
    allowNonOwnerModification: true, // Allow users to modify exercises they don't own (subject to public/private rules)
  }),
  modifyExerciseHandler
);

/**
 * @route DELETE /exercises/:id
 * @desc Delete an exercise
 * @access Private - Based on permission rules:
 * - Only the owner can delete their own exercises
 */
const deleteExerciseHandler: RequestHandler = async (req, res, next) => {
  try {
    const exercise = await getExerciseById(Number(req.params.id));

    if (!exercise) {
      throw new AppError("Exercise not found", 404);
    }
    // check if the exercise is owned by the user
    if (exercise.userId !== req.user?.userId) {
      throw new AppError("You are not the owner of this exercise", 403);
    }

    await deleteExercise(Number(req.params.id));

    res.status(200).json({
      message: "Exercise deleted successfully",
      exerciseId: Number(req.params.id),
    });
  } catch (error) {
    if (error instanceof AppError) {
      next({
        status: error.status,
        message: error.message,
      });
      return;
    }
    next(error);
  }
};
router.delete("/:id", deleteExerciseHandler);

export default router;
