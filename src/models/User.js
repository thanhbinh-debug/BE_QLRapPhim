const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define(
  "User",
  {
    name: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    phone: { type: DataTypes.STRING(20) },
    role: { type: DataTypes.ENUM("user", "admin"), defaultValue: "user" },
    is_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
    email_token: { type: DataTypes.STRING(255) },
    reset_password_token: { type: DataTypes.STRING(255) },
    reset_password_expires: { type: DataTypes.DATE },
  },
  { tableName: "users", timestamps: true },
);

module.exports = User;
