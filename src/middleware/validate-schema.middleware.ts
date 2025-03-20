import { Request, Response, NextFunction } from "express";
import { z } from "zod";

export const validateSchema = <T>(schema: z.ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        next({
          status: 400,
          message: "Invalid input",
          errors: result.error.errors,
        });
        return;
      }

      req.body = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};
