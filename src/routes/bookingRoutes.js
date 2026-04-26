const express = require("express");
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getAllBookings,
} = require("../controllers/bookingController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const adminOnly = [authMiddleware, roleMiddleware("admin")];

router.post("/", authMiddleware, createBooking);
router.get("/me", authMiddleware, getMyBookings);
router.get("/:id", authMiddleware, getBookingById);
router.delete("/:id", authMiddleware, cancelBooking);
router.get("/", adminOnly, getAllBookings);

module.exports = router;
