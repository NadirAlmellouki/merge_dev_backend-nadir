
import { Op } from "sequelize";
import {
  StudySession,
  SessionParticipant,
  User,
} from "../models/associations.js";
import {
  createSession,
  searchSessions,
  getSessionById,
  joinSession,
  acceptJoinRequest,
  checkInToSession,
} from "../services/sessionService.js";
import { calculateMatchScore } from "../services/matchingService.js";

export const listSessions = async (req, res) => {
  try {
    const sessions = await searchSessions(req.query);
    res.json({ success: true, count: sessions.length, sessions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const createStudySession = async (req, res) => {
  try {
    const session = await createSession(req.user.id, req.body);
    res.status(201).json({ success: true, session });
  } catch (err) {
    console.error("Create session error:", err);
    const detail =
      process.env.NODE_ENV !== "production" && err.message
        ? err.message
        : "Erreur lors de la création de la session";
    res.status(500).json({ error: detail });
  }
};

export const getSession = async (req, res) => {
  try {
    const session = await getSessionById(req.params.id);
    if (!session) return res.status(404).json({ error: "Session non trouvée" });

    const participants = await SessionParticipant.findAll({
      where: { session_id: req.params.id },
      include: [{ model: User, as: "user", attributes: ["id", "first_name", "last_name", "trust_score"] }],
    });

    let match_score;
    if (req.query.latitude && req.query.longitude) {
      match_score = calculateMatchScore(session, {
        ...req.user,
        latitude: parseFloat(req.query.latitude),
        longitude: parseFloat(req.query.longitude),
        major: req.user.major,
        year: req.user.year,
      });
    }

    res.json({ success: true, session, participants, match_score });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const requestJoin = async (req, res) => {
  try {
    const participant = await joinSession(
      req.params.id,
      req.user.id,
      req.body.message
    );
    res.status(201).json({ success: true, participant });
  } catch (err) {
    const map = {
      NOT_FOUND: [404, "Session non trouvée"],
      OWN_SESSION: [400, "Vous êtes le créateur"],
      NOT_OPEN: [400, "Session non disponible"],
      REQUEST_LIMIT: [429, "Max 5 demandes en attente"],
      ALREADY_REQUESTED: [409, "Demande déjà envoyée"],
    };
    const [code, msg] = map[err.message] || [500, "Erreur serveur"];
    res.status(code).json({ error: msg });
  }
};

export const acceptRequest = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId requis" });
    const participant = await acceptJoinRequest(
      req.params.id,
      req.user.id,
      userId
    );
    res.json({ success: true, participant });
  } catch (err) {
    const map = {
      FORBIDDEN: [403, "Non autorisé"],
      NOT_FOUND: [404, "Demande introuvable"],
      FULL: [400, "Session complète"],
    };
    const [code, msg] = map[err.message] || [500, "Erreur serveur"];
    res.status(code).json({ error: msg });
  }
};

export const checkIn = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (latitude == null || longitude == null) {
      return res.status(400).json({ error: "latitude et longitude requis" });
    }
    const participant = await checkInToSession(
      req.params.id,
      req.user.id,
      latitude,
      longitude
    );
    res.json({ success: true, participant });
  } catch (err) {
    const map = {
      NOT_FOUND: [404, "Session non trouvée"],
      GEOFENCE: [400, "Hors zone (100m requis)"],
      NOT_PARTICIPANT: [403, "Non participant"],
    };
    const [code, msg] = map[err.message] || [500, "Erreur serveur"];
    res.status(code).json({ error: msg });
  }
};

export const getPendingRequests = async (req, res) => {
  try {
    const session = await StudySession.findByPk(req.params.id);
    if (!session || session.creator_id !== req.user.id) {
      return res.status(403).json({ error: "Non autorisé" });
    }
    const requests = await SessionParticipant.findAll({
      where: {
        session_id: req.params.id,
        user_id: { [Op.ne]: req.user.id },
      },
      include: [{ model: User, as: "user", attributes: { exclude: ["password_hash", "refresh_token"] } }],
      order: [["joined_at", "ASC"]],
    });
    res.json({ success: true, requests });
  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const cancelSession = async (req, res) => {
  try {
    const session = await StudySession.findByPk(req.params.id);
    if (!session) return res.status(404).json({ error: "Session non trouvée" });
    if (session.creator_id !== req.user.id) {
      return res.status(403).json({ error: "Non autorisé" });
    }
    await session.update({ status: "cancelled" });
    res.json({ success: true, session });
  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const mySessions = async (req, res) => {
  try {
    const participations = await SessionParticipant.findAll({
      where: { user_id: req.user.id },
      include: [{ model: StudySession, as: "session" }],
      order: [["joined_at", "DESC"]],
    });
    const sessions = participations
      .map((p) => p.session)
      .filter(Boolean);
    res.json({ success: true, participations, sessions });
  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

