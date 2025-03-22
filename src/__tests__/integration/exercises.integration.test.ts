import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";
import { app } from "../../app";
import request from "supertest";
import path from "path";
import * as schema from "../../db/schema";
import { initializeDatabase } from "../../config/database";
import * as authMiddleware from "../../middleware/auth.middleware";

jest.mock("../../middleware/auth.middleware", () => ({
  authenticateToken: jest.fn(),
  optionalAuthenticateToken: jest.fn(),
}));
const mockAuthMiddleware = authMiddleware as jest.Mocked<typeof authMiddleware>;

describe("Exercises Integration Tests", () => {
  let testDb: ReturnType<typeof drizzle>;
  let sqlite: Database.Database;
  let server: any;

  beforeAll(async () => {
    // Create in-memory database
    sqlite = new Database(":memory:");

    // Initialize test database
    testDb = drizzle(sqlite, {
      logger: false,
      schema,
    });

    // Inject test database
    initializeDatabase(testDb);

    // Run migrations
    const migrationsFolder = path.join(__dirname, "../../../drizzle");
    await migrate(testDb, { migrationsFolder });
    console.log("Migrations completed");

    // Start server
    server = app.listen(0);
  });

  afterAll((done) => {
    sqlite.close();
    server.close(done);
  });

  beforeEach(async () => {
    // Clear database
    await testDb.delete(schema.exercises).execute();
    await testDb.delete(schema.users).execute();

    // Insert test users first
    const testUsers = [
      {
        id: 1,
        username: "testuser1",
        password: "password1",
      },
      {
        id: 2,
        username: "testuser2",
        password: "password2",
      },
    ];

    for (const user of testUsers) {
      await testDb.insert(schema.users).values(user);
    }

    // Insert test data
    const testData = [
      {
        id: 1,
        name: "Push-ups",
        description: "Basic upper body exercise",
        difficulty: 2,
        userId: 1,
        isPublic: 1,
      },
      {
        id: 2,
        name: "Advanced Push-ups",
        description: "Diamond push-ups for triceps",
        difficulty: 4,
        userId: 1,
        isPublic: 1,
      },
      {
        id: 3,
        name: "Private Exercise",
        description: "This is a private exercise",
        difficulty: 1,
        userId: 2,
        isPublic: 0,
      },
      {
        id: 4,
        name: "Squats",
        description: "Basic lower body exercise",
        difficulty: 2,
        userId: 2,
        isPublic: 1,
      },
    ];

    for (const exercise of testData) {
      await testDb.insert(schema.exercises).values(exercise);
    }

    mockAuthMiddleware.optionalAuthenticateToken.mockImplementation(
      (req, res, next) => {
        // No user by default, just go next
        next();
      }
    );
  });

  describe("GET /exercises", () => {
    describe("Without authentication", () => {
      it("should list all public exercises without filters", async () => {
        const response = await request(app).get("/exercises");

        expect(response.status).toBe(200);
        expect(response.body.exercises).toHaveLength(3); // Only public exercises
        expect(response.body.exercises.map((e: any) => e.id)).toEqual([
          1, 2, 4,
        ]);
      });

      it("should filter exercises by name", async () => {
        const response = await request(app).get("/exercises?name=push");

        expect(response.status).toBe(200);
        expect(response.body.exercises).toHaveLength(2);
        expect(response.body.exercises.map((e: any) => e.name)).toEqual([
          "Push-ups",
          "Advanced Push-ups",
        ]);
      });

      it("should filter exercises by difficulty", async () => {
        const response = await request(app).get("/exercises?difficulty=2");

        expect(response.status).toBe(200);
        expect(response.body.exercises).toHaveLength(2);
        expect(response.body.exercises.map((e: any) => e.difficulty)).toEqual([
          2, 2,
        ]);
      });

      it("should filter excercise by description", async () => {
        const response = await request(app).get("/exercises?description=body");

        expect(response.status).toBe(200);
        expect(response.body.exercises).toHaveLength(2);
        expect(response.body.exercises.some((e: any) => e.name === "Push-ups"));
        expect(response.body.exercises.some((e: any) => e.name === "Squats"));
      });

      it("should sort exercises by difficulty", async () => {
        const response = await request(app).get(
          "/exercises?sortBy=difficulty&sortOrder=desc"
        );

        expect(response.status).toBe(200);
        const difficulties = response.body.exercises.map(
          (e: any) => e.difficulty
        );
        expect(difficulties).toEqual([4, 2, 2]); // Should be in descending order

        const responseAsc = await request(app).get(
          "/exercises?sortBy=difficulty&sortOrder=asc"
        );
        const difficultiesAsc = responseAsc.body.exercises.map(
          (e: any) => e.difficulty
        );
        expect(difficultiesAsc).toEqual([2, 2, 4]); // Should be in ascending order
      });
    });

    describe("With authentication", () => {
      it("should include private exercises by the authenticated user when user is authenticated", async () => {
        // override mock to include user 2 as authenticated user
        mockAuthMiddleware.optionalAuthenticateToken.mockImplementation(
          (req, res, next) => {
            req.user = {
              userId: 2,
              username: "testuser2",
            };
            next();
          }
        );

        const response = await request(app).get("/exercises");
        expect(response.status).toBe(200);
        expect(response.body.exercises).toHaveLength(4); // Should see all public exercises + user 2's private exercise
      });
    });

    // it("should show private exercises when user is authenticated", async () => {
    //   const userResponse = await request(app).post("/auth/register").send({
    //     username: "testCreatePrivateExercise",
    //     password: "password2",
    //   });

    //   expect(userResponse.status).toBe(201);

    //   const createPrivateExerciseResponse = await request(app)
    //     .post("/exercises")
    //     .set("Authorization", `${userResponse.body.token}`)
    //     .send({
    //       name: "Private Exercise",
    //       description: "This is a private exercise",
    //       difficulty: 1,
    //       isPublic: 0,
    //     });

    //   if (createPrivateExerciseResponse.status !== 201) {
    //     throw new Error("Failed to create private exercise");
    //   }

    //   const response = await request(app)
    //     .get("/exercises")
    //     .set("Authorization", `${userResponse.body.token}`);

    //   expect(response.status).toBe(200);
    //   expect(response.body.exercises).toHaveLength(4); // Should see all public exercises + user 2's private exercise
    //   expect(
    //     response.body.exercises.some((e: any) => e.name === "Private Exercise")
    //   ).toBe(true);
    // });

    // it("should handle description search", async () => {
    //   const response = await request(app).get("/exercises?description=body");

    //   expect(response.status).toBe(200);
    //   expect(response.body.exercises).toHaveLength(2);
    //   expect(response.body.exercises.map((e: any) => e.name)).toEqual([
    //     "Push-ups",
    //     "Squats",
    //   ]);
    // });

    // it("should handle combined filters", async () => {
    //   const response = await request(app).get(
    //     "/exercises?difficulty=2&description=body&sortBy=difficulty&sortOrder=asc"
    //   );

    //   expect(response.status).toBe(200);
    //   expect(response.body.exercises).toHaveLength(2);
    //   expect(response.body.exercises.map((e: any) => e.name)).toEqual([
    //     "Push-ups",
    //     "Squats",
    //   ]);
    // });
  });
});
