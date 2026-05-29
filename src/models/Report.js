import { DataTypes } from "sequelize";
import sequelize from "../config/db.config.js";

const Report = sequelize.define("report", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  reporter_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  reported_user_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  reported_session_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  reported_message_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.ENUM("pending", "resolved", "dismissed"),
    defaultValue: "pending",
  },
  resolved_by_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  resolved_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false,
});

export default Report;
