import { DataTypes } from "sequelize";
import sequelize from "../config/db.config.js";

const StudySession = sequelize.define("study_session", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  creator_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  topic: {
    type: DataTypes.STRING,
  },
  location: {
    type: DataTypes.GEOMETRY("POINT"),
    allowNull: false,
  },
  location_name: {
    type: DataTypes.STRING,
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  duration_minutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  max_participants: {
    type: DataTypes.INTEGER,
  },
  status: {
    type: DataTypes.ENUM("created", "active", "completed", "cancelled"),
    allowNull: false,
    defaultValue: "created",
  },
}, {
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false,
});

export default StudySession;
