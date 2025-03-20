import { Router, RequestHandler } from "express";
import { db } from "../config/database";
import { users, usersInsertSchema } from "../db/schema";
import { logger } from "../config/logger";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const result = usersInsertSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: "Invalid input",
        errors: result.error.errors,
      });
      return;
    }

    const { username, password } = result.data;
    const query = db.insert(users).values({ username, password }).returning();
    const user = await query;
    res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    logger.error("Registration failed", { error });
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
