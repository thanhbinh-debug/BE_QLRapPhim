const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Booking = sequelize.define(
  "Booking",
  {
    status: {
      type: DataTypes.ENUM("pending", "confirmed", "cancelled"),
      defaultValue: "pending",
    },
    total_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  },
  { tableName: "bookings", timestamps: true },
);

module.exports = Booking;
