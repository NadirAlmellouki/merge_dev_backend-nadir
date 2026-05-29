import User from "./User.js";
import StudySession from "./StudySession.js";
import SessionParticipant from "./SessionParticipant.js";
import Message from "./Message.js";
import Rating from "./Rating.js";
import Report from "./Report.js";
import Block from "./Block.js";
import AdminAction from "./AdminAction.js";

// User -> StudySession
User.hasMany(StudySession, { foreignKey: "creator_id", as: "createdSessions" });
StudySession.belongsTo(User, { foreignKey: "creator_id", as: "creator" });

// User -> SessionParticipant
User.hasMany(SessionParticipant, { foreignKey: "user_id", as: "sessionParticipations" });
SessionParticipant.belongsTo(User, { foreignKey: "user_id", as: "user" });

// User -> Message (sender)
User.hasMany(Message, { foreignKey: "sender_id", as: "sentMessages" });
Message.belongsTo(User, { foreignKey: "sender_id", as: "sender" });

// User -> Message (deleted by admin)
User.hasMany(Message, { foreignKey: "deleted_by_admin_id", as: "deletedMessages" });
Message.belongsTo(User, { foreignKey: "deleted_by_admin_id", as: "deletedBy" });

// User -> Rating (rater)
User.hasMany(Rating, { foreignKey: "rater_id", as: "givenRatings" });
Rating.belongsTo(User, { foreignKey: "rater_id", as: "rater" });

// User -> Rating (rated)
User.hasMany(Rating, { foreignKey: "rated_id", as: "receivedRatings" });
Rating.belongsTo(User, { foreignKey: "rated_id", as: "ratedUser" });

// User -> Report (reporter)
User.hasMany(Report, { foreignKey: "reporter_id", as: "filedReports" });
Report.belongsTo(User, { foreignKey: "reporter_id", as: "reporter" });

// User -> Report (reported user)
User.hasMany(Report, { foreignKey: "reported_user_id", as: "reportedUserReports" });
Report.belongsTo(User, { foreignKey: "reported_user_id", as: "reportedUser" });

// User -> Report (resolved by)
User.hasMany(Report, { foreignKey: "resolved_by_id", as: "resolvedReports" });
Report.belongsTo(User, { foreignKey: "resolved_by_id", as: "resolvedBy" });

// User -> Block (blocker)
User.hasMany(Block, { foreignKey: "blocker_id", as: "blocking" });
Block.belongsTo(User, { foreignKey: "blocker_id", as: "blocker" });

// User -> Block (blocked)
User.hasMany(Block, { foreignKey: "blocked_id", as: "blockedBy" });
Block.belongsTo(User, { foreignKey: "blocked_id", as: "blockedUser" });

// User -> AdminAction (admin)
User.hasMany(AdminAction, { foreignKey: "admin_id", as: "adminActions" });
AdminAction.belongsTo(User, { foreignKey: "admin_id", as: "admin" });

// User -> AdminAction (target)
User.hasMany(AdminAction, { foreignKey: "target_user_id", as: "targetedActions" });
AdminAction.belongsTo(User, { foreignKey: "target_user_id", as: "targetUser" });

// StudySession -> SessionParticipant
StudySession.hasMany(SessionParticipant, { foreignKey: "session_id", as: "participants" });
SessionParticipant.belongsTo(StudySession, { foreignKey: "session_id", as: "session" });

// StudySession -> Message
StudySession.hasMany(Message, { foreignKey: "session_id", as: "messages" });
Message.belongsTo(StudySession, { foreignKey: "session_id", as: "session" });

// StudySession -> Rating
StudySession.hasMany(Rating, { foreignKey: "session_id", as: "sessionRatings" });
Rating.belongsTo(StudySession, { foreignKey: "session_id", as: "session" });

// StudySession -> Report
StudySession.hasMany(Report, { foreignKey: "reported_session_id", as: "sessionReports" });
Report.belongsTo(StudySession, { foreignKey: "reported_session_id", as: "reportedSession" });

// Message -> Report
Message.hasMany(Report, { foreignKey: "reported_message_id", as: "messageReports" });
Report.belongsTo(Message, { foreignKey: "reported_message_id", as: "reportedMessage" });

export {
  User,
  StudySession,
  SessionParticipant,
  Message,
  Rating,
  Report,
  Block,
  AdminAction,
};
