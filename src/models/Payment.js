const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Payment = sequelize.define(
  "Payment",
  {
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    method: { type: DataTypes.ENUM("cash", "momo", "vnpay"), allowNull: false },
    status: {
      type: DataTypes.ENUM("pending", "paid", "failed"),
      defaultValue: "pending",
    },
    paid_at: { type: DataTypes.DATE },
  },
  { tableName: "payments", timestamps: false },
);

module.exports = Payment;
