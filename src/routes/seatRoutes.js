const express = require("express");
const router = express.Router();
const {
  getSeatsByShowtime,
  createSeatsForRoom,
  updateSeat,
  deleteSeat,
} = require("../controllers/seatController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const adminOnly = [authMiddleware, roleMiddleware("admin")];

router.get("/showtime/:id", getSeatsByShowtime); // public
router.post("/room/:roomId", adminOnly, createSeatsForRoom);
router.put("/:id", adminOnly, updateSeat);
router.delete("/:id", adminOnly, deleteSeat);

module.exports = router;
