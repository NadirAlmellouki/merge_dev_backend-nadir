import * as authService from "../services/auth.service.js";
import {
  validateLogin,
  validateRegister,
} from "../validators/auth.validator.js";

export const register = async (req, res) => {
  const data = validateRegister(req.body);
  const { user, token } = await authService.register(data);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: { user, token },
  });
};

export const login = async (req, res) => {
  const data = validateLogin(req.body);
  const { user, token } = await authService.login(data);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: { user, token },
  });
};

export const getMe = async (req, res) => {
  const user = await authService.getProfile(req.user.id);

  res.status(200).json({
    success: true,
    data: { user },
  });
};
