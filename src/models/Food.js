const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Food = sequelize.define(
  "Food",
  {
    name: { type: DataTypes.STRING(150), allowNull: false },
    category: {
      type: DataTypes.ENUM("popcorn", "drink", "combo"),
      allowNull: false,
    },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    // image: { type: DataTypes.STRING(500) },
    image: { type: DataTypes.TEXT },
    description: { type: DataTypes.TEXT },
    is_available: { type: DataTypes.BOOLEAN, defaultValue: true },
    stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  { tableName: "foods", timestamps: false },
);

module.exports = Food;
