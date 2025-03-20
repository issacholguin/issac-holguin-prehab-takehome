import { Router, RequestHandler } from "express";
import { UserInsert, usersInsertSchema } from "../db/schema";
import { validateSchema } from "../middleware/validate-schema.middleware";
import { createUser, getUserByUsername } from "../service/users.service";
import { logger } from "../config/logger";

const router = Router();

const registerHandler: RequestHandler = async (req, res, next) => {
  try {
    const data = req.body as UserInsert;

    const existingUser = await getUserByUsername(data.username);
    if (existingUser) {
      next({
        status: 400,
        message: "Username already exists",
      });
      return;
    }

    const user = await createUser(data);
    res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    next({
      status: 500,
      message: "Internal server error",
      error,
    });
  }
};

router.post("/register", validateSchema(usersInsertSchema), registerHandler);

export default router;
