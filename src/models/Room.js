const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Room = sequelize.define(
  "Room",
  {
    name: { type: DataTypes.STRING(50), allowNull: false },
    capacity: { type: DataTypes.INTEGER, allowNull: false },
    screen_type: {
      type: DataTypes.ENUM("2D", "3D", "IMAX"),
      defaultValue: "2D",
    },
  },
  { tableName: "rooms", timestamps: false },
);

module.exports = Room;
