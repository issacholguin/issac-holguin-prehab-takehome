import { RequestHandler, Router } from "express";
import { createExercise, modifyExercise } from "../service/exercises.service";
import { AppError } from "../types/express/error";
import { authenticateToken } from "../middleware/auth.middleware";
import { validateSchema } from "../middleware/validate-schema.middleware";
import { exercisesInsertSchema, exercisesUpdateSchema } from "../db/schema";
import { updateExercisePermissionGuard } from "../middleware/permission.middleware";

const router = Router();

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

export default router;
