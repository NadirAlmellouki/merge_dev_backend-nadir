import { DataTypes } from "sequelize";
import sequelize from "../config/db.config.js";

const Rating = sequelize.define("rating", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  rater_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  rated_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  session_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5,
    },
  },
}, {
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ["rater_id", "rated_id", "session_id"],
    },
  ],
});

export default Rating;
