import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";
import { app } from "../../app";
import request from "supertest";
import path from "path";
import * as schema from "../../db/schema";
import { initializeDatabase } from "../../config/database";

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
  });

  describe("GET /exercises", () => {
    it("should list all public exercises without filters", async () => {
      const response = await request(app).get("/exercises");

      expect(response.status).toBe(200);
      expect(response.body.exercises).toHaveLength(3); // Only public exercises
      expect(response.body.exercises.map((e: any) => e.id)).toEqual([1, 2, 4]);
    });

    // it("should filter exercises by name", async () => {
    //   const response = await request(app).get("/exercises?name=push");

    //   expect(response.status).toBe(200);
    //   expect(response.body.exercises).toHaveLength(2);
    //   expect(response.body.exercises.map((e: any) => e.name)).toEqual([
    //     "Push-ups",
    //     "Advanced Push-ups",
    //   ]);
    // });

    // it("should filter exercises by difficulty", async () => {
    //   const response = await request(app).get("/exercises?difficulty=2");

    //   expect(response.status).toBe(200);
    //   expect(response.body.exercises).toHaveLength(2);
    //   expect(response.body.exercises.map((e: any) => e.difficulty)).toEqual([
    //     2, 2,
    //   ]);
    // });

    // it("should sort exercises by difficulty", async () => {
    //   const response = await request(app).get(
    //     "/exercises?sortBy=difficulty&sortOrder=desc"
    //   );

    //   expect(response.status).toBe(200);
    //   const difficulties = response.body.exercises.map(
    //     (e: any) => e.difficulty
    //   );
    //   expect(difficulties).toEqual([4, 2, 2]); // Should be in descending order
    // });

    // it("should show private exercises when user is authenticated", async () => {
    //   // First, let's authenticate as user 2
    //   const response = await request(app)
    //     .get("/exercises")
    //     .set("Authorization", "Bearer user2-token") // Assuming your auth middleware can handle this token
    //     .query({ userId: 2 });

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
