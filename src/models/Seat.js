const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Seat = sequelize.define(
  "Seat",
  {
    row: { type: DataTypes.CHAR(1), allowNull: false },
    number: { type: DataTypes.INTEGER, allowNull: false },
    type: {
      type: DataTypes.ENUM("standard", "vip", "couple"),
      defaultValue: "standard",
    },
  },
  { tableName: "seats", timestamps: false },
);

module.exports = Seat;
