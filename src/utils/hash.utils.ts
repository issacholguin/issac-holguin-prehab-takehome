import argon2 from "argon2";
import { logger } from "../config/logger";

export const hashPassword = async (password: string) => {
  return await argon2.hash(password);
};

export const verifyPassword = async (password: string, hash: string) => {
  return await argon2.verify(hash, password);
};

export const comparePasswords = async (password: string, hash: string) => {
  try {
    return await verifyPassword(password, hash);
  } catch (error) {
    logger.error("Error comparing passwords", error);
    throw new Error("Error comparing passwords");
  }
};
