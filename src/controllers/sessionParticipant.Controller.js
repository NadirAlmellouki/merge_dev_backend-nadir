import { Op } from "sequelize";
import SessionParticipant from "../models/SessionParticipant.js";
import StudySession from "../models/StudySession.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";

// JOIN SESSION
export const joinSession = async (req, res) => {
  const sessionId = req.params.sessionId;
  const userId = req.user.id;

  const session = await StudySession.findByPk(sessionId);
  if (!session) throw ApiError.notFound("Session not found");

  if (!["created", "active"].includes(session.status)) {
    throw ApiError.badRequest("Session not joinable");
  }

  const existing = await SessionParticipant.findOne({
    where: { session_id: sessionId, user_id: userId },
  });

  if (existing) {
    if (existing.status === "left") {
      await existing.update({
        status: "joined",
        joined_at: new Date(),
        left_at: null,
      });
      return res.json({ success: true, data: existing });
    }
    throw ApiError.conflict("Already joined");
  }

  const count = await SessionParticipant.count({
    where: {
      session_id: sessionId,
      status: { [Op.in]: ["joined", "checked_in"] },
    },
  });

  if (count >= session.max_participants) {
    throw ApiError.conflict("Session full");
  }

  const participant = await SessionParticipant.create({
    session_id: sessionId,
    user_id: userId,
    status: "joined",
  });

  res.status(201).json({ success: true, data: participant });
};

// LEAVE
export const leaveSession = async (req, res) => {
  const sessionId = req.params.sessionId;
  const userId = req.user.id;

  const participant = await SessionParticipant.findOne({
    where: { session_id: sessionId, user_id: userId },
  });

  if (!participant) throw ApiError.notFound("Not participant");

  await participant.update({
    status: "left",
    left_at: new Date(),
  });

  res.json({ success: true, data: participant });
};

// CHECK-IN
export const checkinSession = async (req, res) => {
  const participant = await SessionParticipant.findOne({
    where: {
      session_id: req.params.sessionId,
      user_id: req.user.id,
    },
  });

  if (!participant) throw ApiError.notFound("Not joined");

  if (participant.status === "left") {
    throw ApiError.badRequest("Already left");
  }

  await participant.update({
    status: "checked_in",
    checked_in_at: new Date(),
  });

  res.json({ success: true, data: participant });
};

// LIST
export const listParticipants = async (req, res) => {
  const sessionId = req.params.sessionId;

  const participants = await SessionParticipant.findAll({
    where: { session_id: sessionId },
    include: [{ model: User, as: "user" }],
  });

  res.json({
    success: true,
    count: participants.length,
    data: participants,
  });
};

// ME
export const getMyParticipation = async (req, res) => {
  const data = await SessionParticipant.findOne({
    where: {
      session_id: req.params.sessionId,
      user_id: req.user.id,
    },
  });

  res.json({
    success: true,
    is_participant: !!data,
    data,
  });
};