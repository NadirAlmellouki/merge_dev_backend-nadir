import { DataTypes } from "sequelize";
import sequelize from "../config/db.config.js";

const Block = sequelize.define("block", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  blocker_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  blocked_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ["blocker_id", "blocked_id"],
    },
  ],
});

export default Block;
