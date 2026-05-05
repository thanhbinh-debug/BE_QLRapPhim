const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const User = require("./User");
const Movie = require("./Movie");
const Room = require("./Room");
const Seat = require("./Seat");
const Showtime = require("./Showtime");
const Booking = require("./Booking");
const Food = require("./Food");
const Payment = require("./Payment");

// Room → Seat
Room.hasMany(Seat, { foreignKey: "room_id", as: "Seats", onDelete: "CASCADE" });
Seat.belongsTo(Room, { foreignKey: "room_id" });

// Movie → Showtime
Movie.hasMany(Showtime, { foreignKey: "movie_id" });
Showtime.belongsTo(Movie, { foreignKey: "movie_id" });

// Room → Showtime
Room.hasMany(Showtime, {
  foreignKey: "room_id",
  onDelete: "CASCADE",
});
Showtime.belongsTo(Room, { foreignKey: "room_id" });

// User → Booking
User.hasMany(Booking, { foreignKey: "user_id" });
Booking.belongsTo(User, { foreignKey: "user_id" });

// Showtime → Booking
Showtime.hasMany(Booking, { foreignKey: "showtime_id" });
Booking.belongsTo(Showtime, { foreignKey: "showtime_id" });

// Booking ↔ Seat (nhiều-nhiều)
Booking.belongsToMany(Seat, {
  through: "booking_seats",
  foreignKey: "booking_id",
  otherKey: "seat_id",
  onDelete: "CASCADE",
});
Seat.belongsToMany(Booking, {
  through: "booking_seats",
  foreignKey: "seat_id",
  otherKey: "booking_id",
});

// Booking ↔ Food (nhiều-nhiều)
Booking.belongsToMany(Food, {
  through: "booking_foods",
  foreignKey: "booking_id",
  otherKey: "food_id",
  onDelete: "CASCADE",
});
Food.belongsToMany(Booking, {
  through: "booking_foods",
  foreignKey: "food_id",
  otherKey: "booking_id",
});

// Booking → Payment
Booking.hasOne(Payment, { foreignKey: "booking_id", onDelete: "CASCADE" });
Payment.belongsTo(Booking, { foreignKey: "booking_id" });

module.exports = {
  sequelize,
  User,
  Movie,
  Room,
  Seat,
  Showtime,
  Booking,
  Food,
  Payment,
};
