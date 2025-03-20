import express from "express";
import authRoutes from "./routes/auth.routes";
import { logger } from "./config/logger";
import { enableLogging } from "./middleware/logging.middleware";
import { AppError } from "./types/express/error";

export const app = express();

// Create a middleware to log HTTP requests
// Only log requests in local development environment
const isLocalDevelopment = process.env.NODE_ENV === "development";
if (isLocalDevelopment) {
  app.use(enableLogging);
}

app.use(express.json());
app.use("/auth", authRoutes);

// Global error handling middleware

app.use(
  (
    err: AppError,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (process.env.NODE_ENV !== "test") {
      logger.error("Error:", err);
    }

    // If the error has a status and message, use those
    const status = err.status || 500;
    const message = err.message || "Internal server error";

    // If there are validation errors, include them
    const response: { message: string; errors?: Record<string, string[]> } = {
      message,
    };
    if (err.errors) {
      response.errors = err.errors;
    }

    res.status(status).json(response);
  }
);

// Start server last
const server = app.listen(3000, () => {
  logger.info("Server is running on port 3000");
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
