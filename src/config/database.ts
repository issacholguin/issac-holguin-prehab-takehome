import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import fs from "fs";
import * as schema from "../db/schema";

// Allow injection of a database instance
let _db: ReturnType<typeof drizzle>;

export const initializeDatabase = (testDb?: ReturnType<typeof drizzle>) => {
  if (testDb) {
    _db = testDb;
    return _db;
  }

  // Ensure data directory exists
  const dataDir =
    process.env.NODE_ENV === "production"
      ? path.join(process.cwd(), "dist", "data")
      : path.join(process.cwd(), "data");

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  const sqlite = new Database(path.join(dataDir, "database.sqlite"));
  _db = drizzle(sqlite, {
    logger: process.env.NODE_ENV !== "production",
    schema,
  });

  return _db;
};

// Initialize the database if not in test mode
if (process.env.NODE_ENV !== "test") {
  initializeDatabase();
}

// Export the database instance
export const db = () => {
  if (!_db) {
    throw new Error("Database not initialized");
  }
  return _db;
};
