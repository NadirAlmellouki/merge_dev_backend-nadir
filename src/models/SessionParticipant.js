
import { DataTypes } from "sequelize";
import sequelize from "../config/db.config.js";

const SessionParticipant = sequelize.define(
  "session_participant",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    session_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "joined",
      allowNull: false,
    },
    checked_in_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    left_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    joined_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "session_participants",
    timestamps: false,
    indexes: [{ unique: true, fields: ["session_id", "user_id"] }],
  }
);

export default SessionParticipant;
