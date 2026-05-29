import { DataTypes } from "sequelize";
import sequelize from "../config/db.config.js";

const Rating = sequelize.define(
  "rating",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    overall_score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    punctuality_score: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5,
      },
    },
    engagement_score: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5,
      },
    },
    would_study_again: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    tableName: "ratings",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [
      { unique: true, fields: ["rater_id", "rated_id", "session_id"] },
      { fields: ["rated_id"] },
      { fields: ["rater_id"] },
      { fields: ["session_id"] },
    ],
  },
);
export default Rating;
