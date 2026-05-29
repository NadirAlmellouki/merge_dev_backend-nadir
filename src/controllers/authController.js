import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const register = async (req, res) => {
  const userData = req.body;
  if ((await User.findOne({ where: { email: userData.email } })) != null)
    return res.status(400).send("rah kayen had khona");
  const salt = await bcrypt.genSalt();
  const hashedPwd = await bcrypt.hash(userData.password, salt);
  userData.password = hashedPwd;
  const createdUser = await User.create(userData);

  const payload = { userId: createdUser.id, role: createdUser.role };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  const { password_hash, ...sentUser } = createdUser.toJSON();
  return res.status(201).json({ user: sentUser, token });
};

async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email: email } });
  if (user == null) {
    return res.status(401).send("makayensh l user");
  }
  if (await bcrypt.compare(password, user.password_hash)) {
    const payload = { userId: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    const { password_hash, ...sentUser } = user.toJSON();
    return res.status(200).json({ sentUser, token });
  } else {
    return res.send("password is incorrect");
  }
}

export default { register, login };
