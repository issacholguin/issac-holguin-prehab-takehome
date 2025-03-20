import { Router, RequestHandler } from "express";
import {
  UserInsert,
  usersInsertSchema,
  usersLoginSchema,
  UserLogin,
} from "../db/schema";
import { validateSchema } from "../middleware/validate-schema.middleware";
import { createUser, getUserByUsername } from "../service/users.service";
import { logger } from "../config/logger";
import {
  generateAccessToken,
  generateRefreshToken,
  TokenPayload,
} from "../utils/jwt.utils";
const router = Router();

const registerHandler: RequestHandler = async (req, res, next) => {
  try {
    const data = req.body as UserInsert;

    const existingUser = await getUserByUsername(data.username);
    if (existingUser) {
      throw new Error("Username already exists");
    }

    const user = await createUser(data);

    const tokenPayload: TokenPayload = {
      userId: user.id,
      username: user.username,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.status(201).json({
      message: "User created successfully",
      user,
      accessToken,
      refreshToken,
    });
    res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    if (error instanceof Error && error.message === "Username already exists") {
      next({
        status: 400,
        message: "Username already exists",
      });
      return;
    }

    next({
      status: 500,
      message: "Internal server error",
      error,
    });
  }
};

router.post("/register", validateSchema(usersInsertSchema), registerHandler);

const loginHandler: RequestHandler = async (req, res, next) => {
  try {
    const data = req.body as UserLogin;
  } catch (error) {
    next({
      status: 500,
      message: "Internal server error",
      error,
    });
  }
};

router.post("/login", validateSchema(usersLoginSchema), loginHandler);

export default router;
