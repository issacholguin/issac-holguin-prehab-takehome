import { Router } from "express";
import db from "../config/database";
const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = db.prepare(
      "INSERT INTO users (username, password) VALUES (?, ?)"
    );
    user.run(username, password);
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
