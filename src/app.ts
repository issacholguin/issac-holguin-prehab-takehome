import express from "express";
import authRoutes from "./routes/auth.routes";
import { logger } from "./config/logger";
import { enableLogging } from "./middleware/logging.middleware";
const app = express();

// Create a middleware to log HTTP requests
// Only log requests in local environment
if (process.env.NODE_ENV === "development") {
  app.use(enableLogging);
}

app.use(express.json());
app.use("/auth", authRoutes);

// Start server last
const server = app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

// Graceful shutdown
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

function gracefulShutdown() {
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });

  // Force close after 10s
  setTimeout(() => {
    logger.error(
      "Could not close connections in time, forcefully shutting down"
    );
    process.exit(1);
  }, 10000);
}
