import request from "supertest";
import { app } from "../../app";
import * as usersService from "../../service/users.service";
import { users } from "../../db/schema";
import type { InferSelectModel } from "drizzle-orm";

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
});
