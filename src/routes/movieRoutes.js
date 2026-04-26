const express = require("express");
const router = express.Router();
const {
  getMovies,
  searchMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
} = require("../controllers/movieController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const adminOnly = [authMiddleware, roleMiddleware("admin")];

router.get("/", getMovies); // public
router.get("/search", searchMovies); // public
router.get("/:id", getMovieById); // public
router.post("/", adminOnly, createMovie);
router.put("/:id", adminOnly, updateMovie);
router.delete("/:id", adminOnly, deleteMovie);

module.exports = router;
