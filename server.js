require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./src/routes/authRoutes");
const { sequelize } = require("./src/models");
const movieRoutes = require("./src/routes/movieRoutes");
const roomRoutes = require("./src/routes/roomRoutes");
const seatRoutes = require("./src/routes/seatRoutes");
const showtimeRoutes = require("./src/routes/showtimeRoutes");
const bookingRoutes = require("./src/routes/bookingRoutes");
const foodRoutes = require("./src/routes/foodRoutes");
const paymentRoutes = require("./src/routes/paymentRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const app = express();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/movies", movieRoutes);
app.use("/rooms", roomRoutes);
app.use("/seats", seatRoutes);
app.use("/showtimes", showtimeRoutes);
app.use("/bookings", bookingRoutes);
app.use("/foods", foodRoutes);
app.use("/payments", paymentRoutes);
app.use("/admin", adminRoutes);

// Kết nối DB rồi mới start server
const PORT = process.env.PORT || 5000;

sequelize
  .authenticate()
  .then(() => {
    console.log("MySQL connected!");
    return sequelize.sync(); // tạo bảng nếu chưa có
  })
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error("Cannot connect to DB:", err));
