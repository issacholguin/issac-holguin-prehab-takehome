import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import fs from "fs";
import * as schema from "../db/schema";
// Ensure data directory exists

const dataDir =
  process.env.NODE_ENV === "production"
    ? path.join(process.cwd(), "dist", "data")
    : path.join(process.cwd(), "data");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const sqlite = new Database(path.join(dataDir, "database.sqlite"));
export const db = drizzle(sqlite, {
  logger: process.env.NODE_ENV !== "production",
  schema,
});
