import { DataTypes } from "sequelize";
import sequelize from "../config/db.config.js";

const Report = sequelize.define(
  "report",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
      type: DataTypes.ENUM(
        "harassment",
        "spam",
        "fake_profile",
        "safety",
        "other",
      ),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "resolved", "dismissed"),
      defaultValue: "pending",
      allowNull: false,
    },
    resolution_action: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    resolved_by_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    resolved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    tableName: "reports",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [
      { fields: ["status", "created_at"] },
      { fields: ["reporter_id"] },
      { fields: ["reported_user_id"] },
    ],
    validate: {
      atLeastOneTarget() {
        if (
          !this.reported_user_id &&
          !this.reported_session_id &&
          !this.reported_message_id
        ) {
          throw new Error(
            "At least one of reported_user_id, reported_session_id, or reported_message_id is required",
          );
        }
      },
    },
  },
);
export default Report;
