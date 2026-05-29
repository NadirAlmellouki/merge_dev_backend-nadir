import { DataTypes } from "sequelize";
import sequelize from "../config/db.config.js";

const StudySession = sequelize.define("study_session", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  topic: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  location_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  location: {
    type: DataTypes.GEOMETRY("POINT", 4326),
    allowNull: true,
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  duration_minutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 60,
  },
  max_participants: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 4,
  },
  study_type: {
    type: DataTypes.ENUM(
      "silent_coworking",
      "active_discussion",
      "exam_prep",
      "homework_help",
      "project_work"
    ),
    allowNull: false,
    defaultValue: "active_discussion",
  },
  status: {
    type: DataTypes.ENUM("created", "active", "completed", "cancelled"),
    allowNull: false,
    defaultValue: "created",
  },
  visibility: {
    type: DataTypes.ENUM("public", "friends_only", "invite_only"),
    allowNull: false,
    defaultValue: "public",
  },
  description: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  creator_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
},
{
  underscored: true,
  tableName: 'study_sessions'
});

export default StudySession;

