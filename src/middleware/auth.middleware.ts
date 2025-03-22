import { Request, Response, NextFunction } from "express";
import { verifyToken, TokenPayload } from "../utils/jwt.utils";
import { AppError } from "../types/express/error";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Authentication middleware that will:
 * - Attach the user to the request if a valid token is provided
 * - Throw an error if no token is provided or if it's invalid
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers["authorization"];

    if (!token) {
      throw new AppError("Authentication token required", 401);
    }

    const user = verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    throw new AppError("Invalid token", 403);
  }
};

/**
 * Optional authentication middleware that will:
 * - Attach the user to the request if a valid token is provided
 * - Continue the request even if no token is provided or if it's invalid
 */
export const optionalAuthenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers["authorization"];

    if (token) {
      const user = verifyToken(token);
      req.user = user;
    }

    next();
  } catch (error) {
    // If token verification fails, continue without attaching user
    next();
  }
};
