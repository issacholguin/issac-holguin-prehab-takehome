import { RequestHandler, Router } from "express";
import { createExercise } from "../service/exercises.service";
import { AppError } from "../types/express/error";
import { authenticateToken } from "../middleware/auth.middleware";
import { validateSchema } from "../middleware/validate-schema.middleware";
import { exercisesInsertSchema } from "../db/schema";

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

export default router;
