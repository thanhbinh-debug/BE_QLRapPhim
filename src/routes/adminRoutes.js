const express = require("express");
const router = express.Router();
const { getDashboardStats } = require("../controllers/adminController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// Chỉ admin mới được xem báo cáo
router.get(
  "/stats",
  authMiddleware,
  roleMiddleware("admin"),
  getDashboardStats,
);

module.exports = router;
