import { Op } from "sequelize";
import sequelize from "../config/db.config.js";
import { StudySession, SessionParticipant } from "../models/associations.js";

export const formatSessionRow = (row) => {
  if (!row) return null;
  const s = { ...row };
  if (row.latitude != null) s.latitude = parseFloat(row.latitude);
  if (row.longitude != null) s.longitude = parseFloat(row.longitude);
  if (row.distance_km != null) s.distance_km = parseFloat(row.distance_km);
  return s;
};

export const createSession = async (creatorId, data) => {
  const location =
    data.latitude != null && data.longitude != null
      ? { type: "Point", coordinates: [data.longitude, data.latitude] }
      : null;

  const session = await StudySession.create({
    subject: data.subject,
    topic: data.topic || null,
    location_name: data.location_name || null,
    location: location ,
    start_time: data.start_time || new Date(),
    duration_minutes: data.duration_minutes || 60,
    max_participants: data.max_participants || 4,
    visibility: data.visibility || "public",
    description: data.description || null,
    creator_id: creatorId,
    status: "created",
  });

  await SessionParticipant.create({
    session_id: session.id,
    user_id: creatorId,
    status: "joined",
  });

  return getSessionById(session.id);
};

export const searchSessions = async (filters = {}) => {
  const {
    latitude,
    longitude,
    radius = 10,
    subject,
    status = "created",
    limit = 50,
  } = filters;

  let where = `ss.status = :status`;
  const replacements = { status, limit };

  if (subject) {
    where += ` AND LOWER(ss.subject) LIKE LOWER(:subject)`;
    replacements.subject = `%${subject}%`;
  }

  const hasGeo = latitude != null && longitude != null;
  if (hasGeo) {
    replacements.lat = parseFloat(latitude);
    replacements.lng = parseFloat(longitude);
    replacements.radius = parseFloat(radius) * 1000;
    // Inclure aussi les sessions sans GPS (lieu texte seulement)
    where += ` AND (
      ss.location IS NULL
      OR ST_DWithin(
        ss.location::geography,
        ST_MakePoint(:lng, :lat)::geography,
        :radius
      )
    )`;
  }

  const sessions = await sequelize.query(
    `
    SELECT ss.*,
      u.first_name AS creator_first_name,
      u.last_name AS creator_last_name,
      u.trust_score AS creator_trust_score,
      ST_X(ss.location::geometry) AS longitude,
      ST_Y(ss.location::geometry) AS latitude,
      (SELECT COUNT(*) FROM session_participants sp
       WHERE sp.session_id = ss.id AND sp.status IN ('joined','accepted','checked_in')) AS participant_count
      ${hasGeo ? `, CASE WHEN ss.location IS NULL THEN NULL
        ELSE ST_Distance(ss.location::geography, ST_MakePoint(:lng, :lat)::geography) / 1000
        END AS distance_km` : ""}
    FROM study_sessions ss
    JOIN users u ON u.id = ss.creator_id
    WHERE ${where}
    ORDER BY ss.start_time DESC
    LIMIT :limit
    `,
    { replacements, type: sequelize.QueryTypes.SELECT }
  );

  return sessions.map(formatSessionRow);
};

export const getSessionById = async (sessionId) => {
  const rows = await sequelize.query(
    `
    SELECT ss.*,
      u.first_name AS creator_first_name,
      u.last_name AS creator_last_name,
      ST_X(ss.location::geometry) AS longitude,
      ST_Y(ss.location::geometry) AS latitude
    FROM study_sessions ss
    JOIN users u ON u.id = ss.creator_id
    WHERE ss.id = :sessionId
    `,
    {
      replacements: { sessionId },
      type: sequelize.QueryTypes.SELECT,
    }
  );
  return formatSessionRow(rows[0]);
};

export const joinSession = async (sessionId, userId, message) => {
  const session = await StudySession.findByPk(sessionId);
  if (!session) throw new Error("NOT_FOUND");
  if (session.creator_id === userId) throw new Error("OWN_SESSION");
  if (session.status !== "created") throw new Error("NOT_OPEN");

  const existing = await SessionParticipant.findOne({
    where: { session_id: sessionId, user_id: userId },
  });
  if (existing) throw new Error("ALREADY_REQUESTED");

  const participant = await SessionParticipant.create({
    session_id: sessionId,
    user_id: userId,
    status: "joined",
  });

  return participant;
};

export const acceptJoinRequest = async (sessionId, creatorId, participantUserId) => {
  const session = await StudySession.findByPk(sessionId);
  if (!session || session.creator_id !== creatorId) throw new Error("FORBIDDEN");

  const participant = await SessionParticipant.findOne({
    where: { session_id: sessionId, user_id: participantUserId },
  });
  if (!participant) throw new Error("NOT_FOUND");

  const count = await SessionParticipant.count({
    where: { session_id: sessionId, status: { [Op.in]: ["joined", "checked_in"] } },
  });
  if (count >= session.max_participants) throw new Error("FULL");

  await participant.update({ status: "joined" });
  return participant;
};

export const checkInToSession = async (sessionId, userId, userLat, userLng) => {
  const session = await getSessionById(sessionId);
  if (!session) throw new Error("NOT_FOUND");

  const { isWithinGeofence } = await import("./geoService.js");
  const canCheckin = await isWithinGeofence(
    session.latitude,
    session.longitude,
    userLat,
    userLng
  );
  if (!canCheckin) throw new Error("GEOFENCE");

  const participant = await SessionParticipant.findOne({
    where: {
      session_id: sessionId,
      user_id: userId,
      status: { [Op.in]: ["joined", "accepted", "checked_in"] },
    },
  });
  if (!participant) throw new Error("NOT_PARTICIPANT");

  await participant.update({ status: "checked_in", checked_in_at: new Date() });

  const checkedIn = await SessionParticipant.count({
    where: { session_id: sessionId, status: "checked_in" },
  });
  if (checkedIn >= 1) {
    await StudySession.update({ status: "active" }, { where: { id: sessionId } });
  }

  return participant;
};
