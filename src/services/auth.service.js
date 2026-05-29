import bcrypt from "bcryptjs";
import ApiError from "../utils/ApiError.js";
import { signToken } from "../utils/jwt.util.js";
import User from "../models/User.js";

const SALT_ROUNDS = 10;

export const register = async (userData) => {
  const existing = await User.findOne({ where: { email: userData.email } });
  if (existing) {
    throw ApiError.conflict("Email already in use");
  }

  const password_hash = await bcrypt.hash(userData.password, SALT_ROUNDS);

  const user = await User.create({
    ...userData,
    password_hash,
  });

  const token = signToken({ id: user.id, email: user.email, role: user.role });

  return { user: user.toJSON(), token };
};

export const login = async ({ email, password }) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });

  const { password_hash: _, ...safeUser } = user.toJSON();
  return { user: safeUser, token };
};

export const getProfile = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw ApiError.notFound("User not found");
  }
  return user;
};
