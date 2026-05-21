const express = require("express");
const router = express.Router();
const {
  getGenres,
  createGenre,
  getCountries,
} = require("../controllers/genreCountryController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const adminOnly = [authMiddleware, roleMiddleware("admin")];

router.get("/genres", getGenres);
router.post("/genres", adminOnly, createGenre);
router.get("/countries", getCountries);

module.exports = router;
