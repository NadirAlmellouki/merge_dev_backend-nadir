import { DataTypes } from "sequelize";
import sequelize from "../config/db.config.js";

const Message = sequelize.define("message", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  session_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  sender_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  deleted_by_admin_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  timestamps: true,
  createdAt: "sent_at",
  updatedAt: false,
});

export default Message;
