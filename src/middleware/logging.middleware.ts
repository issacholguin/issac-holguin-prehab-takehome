import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";

export const enableLogging = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.info(`${req.method} ${req.url}`, {
    body: req.body,
    query: req.query,
    params: req.params,
  });
  next();
};
