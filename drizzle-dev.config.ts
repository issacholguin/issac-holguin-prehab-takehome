import { defineConfig } from "drizzle-kit";
import path from "path";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: path.join(process.cwd(), "data", "database.sqlite"),
  },
});
