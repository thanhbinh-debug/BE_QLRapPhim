const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

// 1. Model Movie gốc của bạn
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
    director: { type: DataTypes.STRING(200) },
    cast: { type: DataTypes.TEXT },
    country: { type: DataTypes.STRING(100) },
    end_date: { type: DataTypes.DATEONLY, allowNull: true },
    copyright_cost: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  { tableName: "movies", timestamps: true },
);

// 2. Thêm mới bảng Thể loại
const Genre = sequelize.define(
  "Genre",
  {
    name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  },
  { tableName: "genres", timestamps: false },
);

// 3. Thêm mới bảng Quốc gia
const Country = sequelize.define(
  "Country",
  {
    name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  },
  { tableName: "countries", timestamps: false },
);

// Gộp chung xuất bản Object (Từ nay file Index.js bóc tách { Movie } sẽ chuẩn chỉ 100%)
module.exports = { Movie, Genre, Country };
