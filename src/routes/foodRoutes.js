const express = require("express");
const router = express.Router();
const {
  getFoods,
  getFoodById,
  createFood,
  updateFood,
  deleteFood,
} = require("../controllers/foodController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const adminOnly = [authMiddleware, roleMiddleware("admin")];

router.get("/", getFoods);
router.get("/:id", getFoodById);
router.post("/", adminOnly, createFood);
router.put("/:id", adminOnly, updateFood);
router.delete("/:id", adminOnly, deleteFood);

module.exports = router;
