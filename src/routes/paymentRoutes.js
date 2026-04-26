const express = require("express");
const router = express.Router();
const {
  createPayment,
  getPaymentHistory,
  getAllPayments,
} = require("../controllers/paymentController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

router.post("/", authMiddleware, createPayment);
router.get("/history", authMiddleware, getPaymentHistory);
router.get("/", [authMiddleware, roleMiddleware("admin")], getAllPayments);

module.exports = router;
