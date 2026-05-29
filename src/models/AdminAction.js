import { DataTypes } from "sequelize";
import sequelize from "../config/db.config.js";

const AdminAction = sequelize.define(
  "admin_action",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    admin_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    action_type: {
      type: DataTypes.ENUM(
        "suspend",
        "unsuspend",
        "ban",
        "delete_session",
        "delete_message",
        "resolve_report",
        "dismiss_report",
        "promote",
        "demote",
        "warn",
      ),
      allowNull: false,
    },
    target_user_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    target_session_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    target_message_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    target_report_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    tableName: "admin_actions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [
      { fields: ["admin_id", "created_at"] },
      { fields: ["target_user_id"] },
      { fields: ["action_type"] },
    ],
  },
);
export default AdminAction;
