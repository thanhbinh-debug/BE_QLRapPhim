const express = require("express");
const router = express.Router();
const {
  getShowtimes,
  getShowtimeById,
  createShowtime,
  updateShowtime,
  deleteShowtime,
} = require("../controllers/showtimeController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const adminOnly = [authMiddleware, roleMiddleware("admin")];

router.get("/", getShowtimes);
router.get("/:id", getShowtimeById);
router.post("/", adminOnly, createShowtime);
router.put("/:id", adminOnly, updateShowtime);
router.delete("/:id", adminOnly, deleteShowtime);

module.exports = router;
