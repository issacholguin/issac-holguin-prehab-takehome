import request from "supertest";
import { app } from "../../app";
import { generateAccessToken } from "../../utils/jwt.utils";
import * as exercisesService from "../../service/exercises.service";
import * as authMiddleware from "../../middleware/auth.middleware";
import { AppError } from "../../types/express/error";

jest.mock("../../service/exercises.service", () => ({
  createExercise: jest.fn(),
}));

jest.mock("../../middleware/auth.middleware", () => ({
  authenticateToken: jest.fn(),
}));

const mockExercisesService = exercisesService as jest.Mocked<
  typeof exercisesService
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
});
