const express = require("express");
const router = express.Router();
const { register, login, getMe } = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, getMe); // cần token

module.exports = router;
