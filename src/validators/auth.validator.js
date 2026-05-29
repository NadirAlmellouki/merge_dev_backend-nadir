import ApiError from "../utils/ApiError.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegister = (body) => {
  const { first_name, last_name, email, password, university, major, year } =
    body;

  if (!first_name || !last_name || !email || !password) {
    throw ApiError.badRequest(
      "first_name, last_name, email and password are required",
    );
  }

  if (!EMAIL_REGEX.test(email)) {
    throw ApiError.badRequest("Invalid email format");
  }

  if (password.length < 8) {
    throw ApiError.badRequest("Password must be at least 8 characters");
  }

  return { first_name, last_name, email, password, university, major, year };
};

export const validateLogin = (body) => {
  const { email, password } = body;

  if (!email || !password) {
    throw ApiError.badRequest("email and password are required");
  }

  return { email, password };
};
