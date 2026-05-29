import User from "../models/User.js";
import Block from "../models/Block.js";

const getMe = async (req, res) => {
  const user = await User.findByPk(req.user.userId);
  if (!user) return res.status(404).send("User not found");
  const { password_hash, ...userData } = user.toJSON();
  return res.json(userData);
};

const updateMe = async (req, res) => {
  const allowed = ["first_name", "last_name", "university", "major", "year", "bio", "profile_photo"];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  await User.update(updates, { where: { id: req.user.userId } });
  const user = await User.findByPk(req.user.userId);
  const { password_hash, ...userData } = user.toJSON();
  return res.json(userData);
};

const getUserById = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).send("User not found");
  const { password_hash, email, is_suspended, suspended_until, is_banned, ...publicData } = user.toJSON();
  return res.json(publicData);
};

const blockUser = async (req, res) => {
  const { blockedUserId } = req.body;
  if (blockedUserId === req.user.userId) return res.status(400).send("Cannot block yourself");
  const userToBlock = await User.findByPk(blockedUserId);
  if (!userToBlock) return res.status(404).send("User not found");
  const [block, created] = await Block.findOrCreate({
    where: { blocker_id: req.user.userId, blocked_id: blockedUserId },
  });
  if (!created) return res.status(400).send("Already blocked");
  return res.status(201).json(block);
};

const unblockUser = async (req, res) => {
  const deleted = await Block.destroy({
    where: { blocker_id: req.user.userId, blocked_id: req.params.blockedUserId },
  });
  if (!deleted) return res.status(404).send("Block not found");
  return res.sendStatus(204);
};

const getBlockedUsers = async (req, res) => {
  const blocks = await Block.findAll({
    where: { blocker_id: req.user.userId },
    include: [{
      model: User,
      as: "blockedUser",
      attributes: ["id", "first_name", "last_name", "profile_photo", "university", "major"],
    }],
  });
  return res.json(blocks);
};

export default { getMe, updateMe, getUserById, blockUser, unblockUser, getBlockedUsers };
