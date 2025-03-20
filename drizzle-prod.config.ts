import { defineConfig } from "drizzle-kit";
import path from "path";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.js",
  out: "./drizzle",
  dbCredentials: {
    url: path.join(process.cwd(), "dist", "data", "database.sqlite"),
  },
});
