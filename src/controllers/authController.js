import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const register = async (req, res) => {
  const { password, ...userData } = req.body;
  if (await User.findOne({ where: { email: userData.email } }))
    return res.status(400).send("rah kayen had khona");
  const salt = await bcrypt.genSalt();
  const password_hash = await bcrypt.hash(password, salt);
  const createdUser = await User.create({ ...userData, password_hash });
  const payload = { userId: createdUser.id, role: createdUser.role };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  const { password_hash: _, ...sentUser } = createdUser.toJSON();
  return res.status(201).json({ user: sentUser, token });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(401).send("makayensh l user");
  if (!(await bcrypt.compare(password, user.password_hash)))
    return res.status(401).send("password is incorrect");
  const payload = { userId: user.id, role: user.role };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  const { password_hash: _, ...sentUser } = user.toJSON();
  return res.status(200).json({ user: sentUser, token });
};

export default { register, login };