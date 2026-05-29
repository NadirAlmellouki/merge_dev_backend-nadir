import { DataTypes } from "sequelize";
import sequelize from "../config/db.config.js";

const SessionParticipant = sequelize.define("session_participant", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
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
    type: DataTypes.ENUM("joined", "checked_in", "left"),
    defaultValue: "joined",
  },
  checked_in_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  left_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  createdAt: "joined_at",
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ["session_id", "user_id"],
    },
  ],
});

export default SessionParticipant;
