import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { AppError } from "./errors";
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken, hashPassword, comparePassword } from "../services/auth";
import { UserRole } from "../shared-types";

describe("Server Utilities", () => {
  describe("AppError", () => {
    it("should create error with default values", () => {
      const error = new AppError("Test error");
      expect(error.message).toBe("Test error");
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe("INTERNAL_ERROR");
      expect(error.isOperational).toBe(true);
    });

    it("should create error with custom status code and code", () => {
      const error = new AppError("Not found", 404, "NOT_FOUND");
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe("NOT_FOUND");
    });

    it("should have static factory methods", () => {
      expect(AppError.badRequest("Bad request").statusCode).toBe(400);
      expect(AppError.unauthorized().statusCode).toBe(401);
      expect(AppError.forbidden().statusCode).toBe(403);
      expect(AppError.notFound().statusCode).toBe(404);
      expect(AppError.conflict("Conflict").statusCode).toBe(409);
      expect(AppError.internal().statusCode).toBe(500);
    });
  });

  describe("Auth Service", () => {
    const testPayload = {
      userId: "507f1f77bcf86cd799439011",
      email: "test@school.com",
      role: UserRole.PRINCIPAL,
      schoolId: "507f1f77bcf86cd799439012"
    };

    it("should generate and verify access token", () => {
      const token = generateAccessToken(testPayload);
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3);

      const decoded = verifyAccessToken(token);
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.role).toBe(testPayload.role);
      expect(decoded.schoolId).toBe(testPayload.schoolId);
    });

    it("should generate and verify refresh token", () => {
      const token = generateRefreshToken(testPayload);
      expect(typeof token).toBe("string");

      const decoded = verifyRefreshToken(token);
      expect(decoded.userId).toBe(testPayload.userId);
    });

    it("should throw on invalid access token", () => {
      expect(() => verifyAccessToken("invalid.token")).toThrow();
    });

    it("should throw on invalid refresh token", () => {
      expect(() => verifyRefreshToken("invalid.token")).toThrow();
    });
  });

  describe("Password Hashing", () => {
    it("should hash and compare passwords", async () => {
      const password = "securePassword123";
      const hash = await hashPassword(password);
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);

      const isValid = await comparePassword(password, hash);
      expect(isValid).toBe(true);
    });

    it("should return false for wrong password", async () => {
      const hash = await hashPassword("password123");
      const isValid = await comparePassword("wrongPassword", hash);
      expect(isValid).toBe(false);
    });

    it("should generate different hashes for same password", async () => {
      const password = "password123";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      expect(hash1).not.toBe(hash2);
    });
  });
});