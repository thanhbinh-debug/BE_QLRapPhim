const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Showtime = sequelize.define(
  "Showtime",
  {
    start_time: { type: DataTypes.DATE, allowNull: false },
    end_time: { type: DataTypes.DATE, allowNull: false },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    price_vip: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  },
  { tableName: "showtimes", timestamps: false },
);

module.exports = Showtime;
