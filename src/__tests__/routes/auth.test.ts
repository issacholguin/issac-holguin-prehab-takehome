import request from "supertest";
import { app } from "../../app";
import * as usersService from "../../service/users.service";
import { users } from "../../db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { hashPassword } from "../../utils/hash.utils";

type User = InferSelectModel<typeof users>;

jest.mock("../../service/users.service", () => ({
  ...jest.requireActual("../../service/users.service"),
  getUserByUsername: jest.fn(),
  createUser: jest.fn(),
}));

const mockUsersService = usersService as jest.Mocked<typeof usersService>;

describe("Auth Routes", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("POST /auth/register", () => {
    it("should register a new user successfully", async () => {
      // Mock service responses
      mockUsersService.getUserByUsername.mockResolvedValue(
        undefined as unknown as User
      );
      mockUsersService.createUser.mockResolvedValue({
        id: 1,
        username: "testuser",
      });

      const validUser = {
        username: "testuser",
        password: "Test123!",
      };

      const response = await request(app)
        .post("/auth/register")
        .send(validUser)
        .expect(201)
        .expect("Content-Type", /json/);

      // make sure pasword is not there
      expect(response.body).toEqual({
        message: "User created successfully",
        user: expect.any(Object),
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });
      expect(response.body.user.password).toBeUndefined();

      expect(mockUsersService.getUserByUsername).toHaveBeenCalledWith(
        validUser.username
      );
      expect(mockUsersService.createUser).toHaveBeenCalledWith(validUser);
    });

    it("should return 400 if username already exists", async () => {
      // Mock service response for existing user
      mockUsersService.getUserByUsername.mockResolvedValue({
        id: 1,
        username: "testuser",
        password: "Test123!",
      });

      const validUser = {
        username: "testuser",
        password: "Test123!",
      };

      const response = await request(app)
        .post("/auth/register")
        .send(validUser)
        .expect(400);

      expect(response.body).toEqual({
        message: "Username already exists",
      });
    });

    it("should return 400 if validation fails", async () => {
      // missing password
      let response = await request(app)
        .post("/auth/register")
        .send({ username: "test" })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(mockUsersService.getUserByUsername).not.toHaveBeenCalled();
      expect(mockUsersService.createUser).not.toHaveBeenCalled();

      // missing username
      response = await request(app)
        .post("/auth/register")
        .send({ password: "Test123!" })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(mockUsersService.getUserByUsername).not.toHaveBeenCalled();
      expect(mockUsersService.createUser).not.toHaveBeenCalled();

      // missing both
      response = await request(app).post("/auth/register").send({}).expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(mockUsersService.getUserByUsername).not.toHaveBeenCalled();
      expect(mockUsersService.createUser).not.toHaveBeenCalled();

      // adding id
      response = await request(app)
        .post("/auth/register")
        .send({ id: 1, username: "testuser", password: "Test123!" })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(mockUsersService.getUserByUsername).not.toHaveBeenCalled();
      expect(mockUsersService.createUser).not.toHaveBeenCalled();
    });
  });

  describe("POST /auth/login", () => {
    it("should login a user successfully", async () => {
      const user = {
        id: 1,
        username: "testuser",
        password: await hashPassword("Test123!"),
      };
      // Mock service response for existing user
      mockUsersService.getUserByUsername.mockResolvedValue(user);

      const response = await request(app)
        .post("/auth/login")
        .send({ username: "testuser", password: "Test123!" })
        .expect(200)
        .expect("Content-Type", /json/);

      expect(response.body).toEqual({
        message: "User logged in successfully",
        user: expect.any(Object),
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });
      // no password in response since we are working with users table
      expect(response.body.user.password).toBeUndefined();
    });

    it("should return 400 if validation fails", async () => {
      const user = {
        id: 1,
        username: "testuser",
        password: await hashPassword("Test123!"),
      };
      // Mock service response for existing user
      mockUsersService.getUserByUsername.mockResolvedValue(user);
      // missing password
      let response = await request(app)
        .post("/auth/login")
        .send({ username: "testuser" })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(mockUsersService.getUserByUsername).not.toHaveBeenCalled();

      // missing username
      response = await request(app)
        .post("/auth/login")
        .send({ password: "Test123!" })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toHaveLength(1);
      expect(response.body.errors[0]).toHaveProperty("message");
      expect(response.body.errors[0].message).toBe("Required");

      // missing password
      response = await request(app)
        .post("/auth/login")
        .send({ username: "testuser" })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toHaveLength(1);
      expect(response.body.errors[0]).toHaveProperty("message");
      expect(response.body.errors[0].message).toBe("Required");
    });

    it("should return 401 if username/password combination is incorrect", async () => {
      const user = {
        id: 1,
        username: "testuser",
        password: await hashPassword("Test123!"),
      };
      // Mock service response for existing user
      mockUsersService.getUserByUsername.mockResolvedValue(user);

      let response = await request(app)
        .post("/auth/login")
        .send({ username: "testuser", password: "IncorrectPassword" })
        .expect(401);

      expect(response.body).toEqual({
        message: "Invalid username or password",
      });

      mockUsersService.getUserByUsername.mockResolvedValue(
        undefined as unknown as User
      );

      response = await request(app)
        .post("/auth/login")
        .send({ username: "incorrectusername", password: "Test123!" })
        .expect(401);

      expect(response.body).toEqual({
        message: "Invalid username or password",
      });
    });
  });
});
