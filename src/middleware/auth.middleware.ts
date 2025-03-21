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
