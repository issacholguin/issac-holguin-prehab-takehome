import { Request, Response, NextFunction } from "express";
import { updateExercisePermissionGuard } from "../../middleware/permission.middleware";
import * as exercisesService from "../../service/exercises.service";
import { AppError } from "../../types/express/error";
import { Exercise } from "../../db/schema";

jest.mock("../../service/exercises.service", () => ({
  getExerciseById: jest.fn(),
}));

const mockExercisesService = exercisesService as jest.Mocked<
  typeof exercisesService
>;

describe("updateExercisePermissionGuard", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  describe("anyoneCanModifyPublicExercises - true, allowNonOwnerModification - true", () => {
    const middleware = updateExercisePermissionGuard({
      // Even with most restrictive settings
      anyoneCanModifyPublicExercises: true,
      allowNonOwnerModification: true,
    });

    beforeEach(() => {
      jest.clearAllMocks();
      mockNext = jest.fn();
      mockReq = {
        params: { id: "1" },
        user: { userId: 123, username: "testuser" },
      };
      mockRes = {};
    });

    it("should verify owner can modify their own exercise, regardless of public/private status", async () => {
      // Setup: User is owner of a private exercise, override
      mockExercisesService.getExerciseById.mockResolvedValue({
        id: 1,
        userId: 123,
        isPublic: false,
        name: "Test Exercise",
        description: "Test Description",
        difficulty: 1,
      });

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith("User is the owner");

      // Setup2: User is owner of a public exercise
      mockExercisesService.getExerciseById.mockResolvedValue({
        id: 1,
        userId: 123,
        isPublic: true,
        name: "Test Exercise",
        description: "Test Description",
        difficulty: 1,
      });

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(2);
      expect(mockNext).toHaveBeenCalledWith("User is the owner");
    });

    it("should verify a public exercise can be modified by any authenticated user", async () => {
      // Setup: User is NOT owner of a public exercise
      mockExercisesService.getExerciseById.mockResolvedValue({
        id: 1,
        userId: 456, // Different from mockReq.user.userId
        isPublic: true,
        name: "Test Exercise",
        description: "Test Description",
        difficulty: 1,
      });

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(
        "All checks passed, user is allowed to modify exercise"
      );
    });

    it("should verify a non-public exercise can ONLY be modified by its creator", async () => {
      // Setup: User is NOT owner of a public exercise
      mockExercisesService.getExerciseById.mockResolvedValue({
        id: 1,
        userId: 456, // Different from mockReq.user.userId
        isPublic: false,
        name: "Test Exercise",
        description: "Test Description",
        difficulty: 1,
      });

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0]).toHaveProperty(
        "message",
        "Only the owner can modify their own non-public exercises"
      );
    });
  });
});
