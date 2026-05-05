const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  verifyEmail,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, getMe); // cần token

router.get("/verify-email", verifyEmail); // Xác thực mail
router.post("/forgot-password", forgotPassword); // Yêu cầu quên MK
router.post("/reset-password/:token", resetPassword); // Đổi MK mới
module.exports = router;
