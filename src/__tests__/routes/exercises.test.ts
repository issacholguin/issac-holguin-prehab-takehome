import request from "supertest";
import { app } from "../../app";
import * as exercisesService from "../../service/exercises.service";
import * as authMiddleware from "../../middleware/auth.middleware";
import * as permissionGuardMiddleware from "../../middleware/permission.middleware";
import { AppError } from "../../types/express/error";
import { Request, Response, NextFunction } from "express";
import { ExercisePermissionRules } from "../../middleware/permission.middleware";

jest.mock("../../service/exercises.service", () => ({
  createExercise: jest.fn(),
  modifyExercise: jest.fn(),
  deleteExercise: jest.fn(),
  getExerciseById: jest.fn(),
  listExercises: jest.fn(),
}));

jest.mock("../../middleware/auth.middleware", () => ({
  authenticateToken: jest.fn(),
  optionalAuthenticateToken: jest.fn(),
}));

jest.mock("../../middleware/permission.middleware", () => ({
  updateExercisePermissionGuard: jest.fn().mockImplementation(() => {
    return (req: Request, res: Response, next: NextFunction) => next();
  }),
}));

const mockExercisesService = exercisesService as jest.Mocked<
  typeof exercisesService
>;

const mockPermissionGuardMiddleware = permissionGuardMiddleware as jest.Mocked<
  typeof permissionGuardMiddleware
>;

const mockAuthMiddleware = authMiddleware as jest.Mocked<typeof authMiddleware>;

let server: any;

beforeAll(() => {
  server = app.listen(0); // Using port 0 lets the OS assign a random available port
});

afterAll((done) => {
  server.close(done);
});

describe("Exercise Routes", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("POST /exercises", () => {
    const mockUser = {
      userId: 1,
      username: "testuser",
    };
    beforeEach(() => {
      mockAuthMiddleware.authenticateToken.mockImplementation(
        (req, res, next) => {
          req.user = mockUser;
          next();
        }
      );
    });

    it("should create an exercise", async () => {
      mockExercisesService.createExercise.mockResolvedValue({
        id: 1,
        name: "Pushups",
        description: "Pushups are a great exercise for the chest",
        difficulty: 1,
        isPublic: true,
        userId: mockUser.userId,
      });

      const response = await request(app).post("/exercises").send({
        name: "Pushups",
        description: "Pushups are a great exercise for the chest",
        difficulty: 1,
        isPublic: 1,
      });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Exercise created successfully");
      expect(response.body.exercise.id).toBe(1);
      expect(response.body.exercise.name).toBe("Pushups");
      expect(response.body.exercise.description).toBe(
        "Pushups are a great exercise for the chest"
      );
      expect(response.body.exercise.difficulty).toBe(1);
    });

    it("should return 401 if no token is provided", async () => {
      mockAuthMiddleware.authenticateToken.mockImplementation(
        (req, res, next) => {
          throw new AppError("Authentication token required", 401);
        }
      );
      const response = await request(app).post("/exercises").send({
        name: "Pushups",
        description: "Pushups are a great exercise for the chest",
        difficulty: 1,
        isPublic: 1,
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Authentication token required");
    });

    it("should return 403 if token is in valid", async () => {
      mockAuthMiddleware.authenticateToken.mockImplementation(
        (req, res, next) => {
          throw new AppError("Invalid token", 403);
        }
      );
      const response = await request(app).post("/exercises").send({
        name: "Pushups",
        description: "Pushups are a great exercise for the chest",
        difficulty: 1,
        isPublic: 1,
      });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Invalid token");
    });

    it("should return 400 if the request body is invalid", async () => {
      // remove field names
      let response = await request(app).post("/exercises").send({
        name: "Pushups",
        description: "Pushups are a great exercise for the chest",
        difficulty: 1,
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid input");

      response = await request(app).post("/exercises").send({
        description: "Pushups are a great exercise for the chest",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid input");

      response = await request(app).post("/exercises").send({
        name: "Pushups",
        description: "",
        difficulty: 1,
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid input");
    });

    it("should only accept difficulty values between 1 and 5", async () => {
      let response = await request(app).post("/exercises").send({
        name: "Pushups",
        description: "Pushups are a great exercise for the chest",
        difficulty: 6,
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid input");

      response = await request(app).post("/exercises").send({
        name: "Pushups",
        description: "Pushups are a great exercise for the chest",
        difficulty: 0,
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid input");

      response = await request(app).post("/exercises").send({
        name: "Pushups",
        description: "Pushups are a great exercise for the chest",
        difficulty: 1.5,
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid input");
    });
  });

  describe("PATCH /exercises/:id", () => {
    const mockUser = {
      userId: 1,
      username: "testuser",
    };

    beforeEach(() => {
      mockAuthMiddleware.authenticateToken.mockImplementation(
        (req, res, next) => {
          req.user = mockUser;
          next();
        }
      );

      mockPermissionGuardMiddleware.updateExercisePermissionGuard.mockImplementation(
        (rules: ExercisePermissionRules) =>
          async (req: Request, res: Response, next: NextFunction) => {
            next();
          }
      );
    });

    it("should allow an update to an exercise", async () => {
      const exerciseId = 1;
      const updatedExercise = {
        name: "Modified Pushups",
        description: "Updated description for pushups",
        difficulty: 2,
      };

      mockExercisesService.modifyExercise.mockResolvedValue({
        id: exerciseId,
        ...updatedExercise,
        userId: mockUser.userId,
        isPublic: true,
      });

      const response = await request(app)
        .patch(`/exercises/${exerciseId}`)
        .send(updatedExercise);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Exercise modified successfully");
      expect(response.body.exercise).toEqual({
        id: exerciseId,
        ...updatedExercise,
        userId: mockUser.userId,
        isPublic: true,
      });
    });

    it("should return 404 if the exercise does not exist", async () => {
      const exerciseId = 1;
      mockExercisesService.modifyExercise.mockRejectedValue(
        new AppError("Exercise not found", 404)
      );

      const response = await request(app)
        .patch(`/exercises/${exerciseId}`)
        .send({
          name: "Pushups",
          description: "Pushups are a great exercise for the chest",
          difficulty: 1,
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Exercise not found");
    });

    it("should return 401 if no token is provided", async () => {
      const exerciseId = 1;

      mockAuthMiddleware.authenticateToken.mockImplementation(
        (req, res, next) => {
          throw new AppError("Authentication token required", 401);
        }
      );
      const response = await request(app)
        .patch(`/exercises/${exerciseId}`)
        .send({
          name: "Pushups",
          description: "Pushups are a great exercise for the chest",
          difficulty: 1,
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Authentication token required");
    });

    it("should return 403 if token is invalid", async () => {
      const exerciseId = 1;

      mockAuthMiddleware.authenticateToken.mockImplementation(
        (req, res, next) => {
          throw new AppError("Invalid token", 403);
        }
      );
      const response = await request(app)
        .patch(`/exercises/${exerciseId}`)
        .send({
          name: "Pushups",
          description: "Pushups are a great exercise for the chest",
          difficulty: 1,
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Invalid token");
    });
  });

  describe("DELETE /exercises/:id", () => {
    const mockUser = {
      userId: 1,
      username: "testuser",
    };

    beforeEach(() => {
      jest.clearAllMocks();
      // bypass auth middleware
      mockAuthMiddleware.authenticateToken.mockImplementation(
        (req, res, next) => {
          req.user = mockUser;
          next();
        }
      );

      // bypass permission guard middleware
      mockPermissionGuardMiddleware.updateExercisePermissionGuard.mockImplementation(
        (rules: ExercisePermissionRules) =>
          async (req: Request, res: Response, next: NextFunction) => {
            next();
          }
      );
    });

    it("should delete an exercise successfully", async () => {
      const exerciseId = 1;

      mockExercisesService.getExerciseById.mockResolvedValue({
        id: exerciseId,
        name: "Test Exercise",
        description: "Test Description",
        difficulty: 1,
        isPublic: true,
        userId: mockUser.userId,
      });

      mockExercisesService.deleteExercise.mockResolvedValue({
        message: "Exercise deleted successfully",
        id: exerciseId,
      });

      const response = await request(app).delete(`/exercises/${exerciseId}`);
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Exercise deleted successfully");
    });

    it("should return 403 if user is not the owner of the exercise", async () => {
      const exerciseId = 1;

      mockExercisesService.getExerciseById.mockResolvedValue({
        id: exerciseId,
        name: "Test Exercise",
        description: "Test Description",
        difficulty: 1,
        isPublic: true,
        userId: 2, // Different user ID than the authenticated user
      });

      const response = await request(app).delete(`/exercises/${exerciseId}`);
      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        "You are not the owner of this exercise"
      );
    });

    it("should return 404 if the exercise does not exist", async () => {
      const exerciseId = 1;

      mockExercisesService.getExerciseById.mockResolvedValue(null);

      const response = await request(app).delete(`/exercises/${exerciseId}`);
      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Exercise not found");
    });
  });
});
