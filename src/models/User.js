import { DataTypes } from "sequelize";
import sequelize from "../config/db.config.js";

const User = sequelize.define("user", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  university: {
    type: DataTypes.STRING,
  },
  major: {
    type: DataTypes.STRING,
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  profile_photo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM("student", "moderator", "admin", "super_admin"),
    defaultValue: "student",
    allowNull: false,
  },
  trust_score: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0,
  },
  profile_photo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  is_suspended: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  suspended_until: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  is_banned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false,
});

export default User;