const express = require("express");
const router = express.Router();
const {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} = require("../controllers/roomController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const adminOnly = [authMiddleware, roleMiddleware("admin")];

router.get("/", getRooms);
router.get("/:id", getRoomById);
router.post("/", adminOnly, createRoom);
router.put("/:id", adminOnly, updateRoom);
router.delete("/:id", adminOnly, deleteRoom);

module.exports = router;
