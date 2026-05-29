import { DataTypes } from "sequelize";
import sequelize from "../config/db.config.js";

const AdminAction = sequelize.define("admin_action", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  admin_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  action_type: {
    type: DataTypes.ENUM(
      "suspend",
      "ban",
      "delete_session",
      "delete_message",
      "resolve_report"
    ),
    allowNull: false,
  },
  target_user_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  reason: {
    type: DataTypes.TEXT,
  },
}, {
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false,
});

export default AdminAction;
