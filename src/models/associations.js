import User from "./User.js";
import StudySession from "./StudySession.js";
import SessionParticipant from "./SessionParticipant.js";
import Message from "./Message.js";
import Rating from "./Rating.js";
import Report from "./Report.js";
import AdminAction from "./AdminAction.js";

const setupAssociations = () => {
  // ── StudySession / User ───────────────────────────────────
  StudySession.belongsTo(User, {
    foreignKey: "creator_id",
    as: "creator",
  });
  User.hasMany(StudySession, {
    foreignKey: "creator_id",
    as: "createdSessions",
  });

  StudySession.hasMany(SessionParticipant, {
    foreignKey: "session_id",
    as: "participants",
  });
  SessionParticipant.belongsTo(StudySession, {
    foreignKey: "session_id",
    as: "session",
  });

  SessionParticipant.belongsTo(User, {
    foreignKey: "user_id",
    as: "user",
  });
  User.hasMany(SessionParticipant, {
    foreignKey: "user_id",
    as: "participations",
  });

  // ── Message ──────────────────────────────────────────────
  Message.belongsTo(StudySession, {
    foreignKey: "session_id",
    as: "session",
  });
  StudySession.hasMany(Message, {
    foreignKey: "session_id",
    as: "messages",
  });

  Message.belongsTo(User, {
    foreignKey: "sender_id",
    as: "sender",
  });
  User.hasMany(Message, {
    foreignKey: "sender_id",
    as: "sentMessages",
  });

  Message.belongsTo(User, {
    foreignKey: "deleted_by_admin_id",
    as: "deletedByAdmin",
  });
  User.hasMany(Message, {
    foreignKey: "deleted_by_admin_id",
    as: "deletedMessages",
  });

  // ── Rating ───────────────────────────────────────────────
  Rating.belongsTo(User, {
    foreignKey: "rater_id",
    as: "rater",
  });
  User.hasMany(Rating, {
    foreignKey: "rater_id",
    as: "ratingsGiven",
  });

  Rating.belongsTo(User, {
    foreignKey: "rated_id",
    as: "rated",
  });
  User.hasMany(Rating, {
    foreignKey: "rated_id",
    as: "ratingsReceived",
  });

  Rating.belongsTo(StudySession, {
    foreignKey: "session_id",
    as: "session",
  });
  StudySession.hasMany(Rating, {
    foreignKey: "session_id",
    as: "ratings",
  });

  // ── Report ───────────────────────────────────────────────
  Report.belongsTo(User, {
    foreignKey: "reporter_id",
    as: "reporter",
  });
  User.hasMany(Report, {
    foreignKey: "reporter_id",
    as: "submittedReports",
  });

  Report.belongsTo(User, {
    foreignKey: "reported_user_id",
    as: "reportedUser",
  });
  User.hasMany(Report, {
    foreignKey: "reported_user_id",
    as: "reportsAgainstUser",
  });

  Report.belongsTo(StudySession, {
    foreignKey: "reported_session_id",
    as: "reportedSession",
  });
  StudySession.hasMany(Report, {
    foreignKey: "reported_session_id",
    as: "reports",
  });

  Report.belongsTo(Message, {
    foreignKey: "reported_message_id",
    as: "reportedMessage",
  });
  Message.hasMany(Report, {
    foreignKey: "reported_message_id",
    as: "reports",
  });

  Report.belongsTo(User, {
    foreignKey: "resolved_by_id",
    as: "resolvedBy",
  });
  User.hasMany(Report, {
    foreignKey: "resolved_by_id",
    as: "resolvedReports",
  });

  // ── AdminAction ──────────────────────────────────────────
  AdminAction.belongsTo(User, {
    foreignKey: "admin_id",
    as: "admin",
  });
  User.hasMany(AdminAction, {
    foreignKey: "admin_id",
    as: "adminActions",
  });

  AdminAction.belongsTo(User, {
    foreignKey: "target_user_id",
    as: "targetUser",
  });
  User.hasMany(AdminAction, {
    foreignKey: "target_user_id",
    as: "targetedAdminActions",
  });

  AdminAction.belongsTo(StudySession, {
    foreignKey: "target_session_id",
    as: "targetSession",
  });
  StudySession.hasMany(AdminAction, {
    foreignKey: "target_session_id",
    as: "adminActions",
  });

  AdminAction.belongsTo(Message, {
    foreignKey: "target_message_id",
    as: "targetMessage",
  });
  Message.hasMany(AdminAction, {
    foreignKey: "target_message_id",
    as: "adminActions",
  });

  AdminAction.belongsTo(Report, {
    foreignKey: "target_report_id",
    as: "targetReport",
  });
  Report.hasMany(AdminAction, {
    foreignKey: "target_report_id",
    as: "adminActions",
  });
};

export {
  User,
  StudySession,
  SessionParticipant,
  Message,
  Rating,
  Report,
  AdminAction,
  setupAssociations,
};

export default setupAssociations;
