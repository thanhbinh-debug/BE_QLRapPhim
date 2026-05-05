const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Movie = sequelize.define(
  "Movie",
  {
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT },
    genre: { type: DataTypes.STRING(100) },
    duration: { type: DataTypes.INTEGER },
    poster: { type: DataTypes.STRING(500) },
    trailer_url: { type: DataTypes.STRING(500) },
    status: {
      type: DataTypes.ENUM("now_showing", "coming_soon"),
      defaultValue: "coming_soon",
    },
    release_date: { type: DataTypes.DATEONLY },
    rating: { type: DataTypes.DECIMAL(2, 1), defaultValue: 0 },
    // --- THÊM MỚI ---
    director: { type: DataTypes.STRING(200) },
    cast: { type: DataTypes.TEXT },
    country: { type: DataTypes.STRING(100) },
  },
  { tableName: "movies", timestamps: true },
);

module.exports = Movie;
