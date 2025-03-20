import { Router, RequestHandler } from "express";
import {
  UserInsert,
  usersInsertSchema,
  usersLoginSchema,
  UserLogin,
  User,
} from "../db/schema";
import { validateSchema } from "../middleware/validate-schema.middleware";
import {
  createUser,
  getUserById,
  getUserByUsername,
} from "../service/users.service";
import { logger } from "../config/logger";
import {
  generateAccessToken,
  generateRefreshToken,
  TokenPayload,
  verifyToken,
} from "../utils/jwt.utils";
import { comparePasswords } from "../utils/hash.utils";
import { AppError } from "../types/express/error";

const router = Router();

/**
 * @route POST /auth/register
 * @desc Register a user
 * @access Public
 */
const registerHandler: RequestHandler = async (req, res, next) => {
  try {
    const data = req.body as UserInsert;

    const existingUser = await getUserByUsername(data.username);
    if (existingUser) {
      throw new AppError("Username already exists", 400);
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
  } catch (error) {
    if (error instanceof AppError) {
      next({
        status: error.status,
        message: error.message,
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

/**
 * @route POST /auth/login
 * @desc Login a user
 * @access Public
 */
const loginHandler: RequestHandler = async (req, res, next) => {
  try {
    const data = req.body as UserLogin;
    const user = await getUserByUsername(data.username);

    if (!user) {
      throw new AppError("Invalid username or password", 401);
    }

    const isPasswordValid = await comparePasswords(
      data.password,
      user.password
    );
    if (!isPasswordValid) {
      throw new AppError("Invalid username or password", 401);
    }

    const userWithoutPassword = {
      id: user.id,
      username: user.username,
    } as User;

    const tokenPayload: TokenPayload = {
      userId: user.id,
      username: user.username,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.status(200).json({
      message: "User logged in successfully",
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof AppError) {
      next({
        status: error.status,
        message: error.message,
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

router.post("/login", validateSchema(usersLoginSchema), loginHandler);

/**
 * @route POST /auth/refresh-token
 * @desc Refresh a user's access token
 * @access Public
 */
const refreshTokenHandler: RequestHandler = async (req, res, next) => {
  try {
    const data = req.body as { refreshToken: string };
    const decodedToken = verifyToken(data.refreshToken);

    const user = await getUserById(decodedToken.userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const tokenPayload: TokenPayload = {
      userId: user.id,
      username: user.username,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.status(200).json({
      message: "Access token refreshed successfully",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof AppError) {
      next({
        status: error.status,
        message: error.message,
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

router.post("/refresh-token", refreshTokenHandler);

export default router;
