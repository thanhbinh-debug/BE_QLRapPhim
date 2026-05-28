const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const {
  getMovies,
  searchMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  getGenres,
  createGenre,
  getCountries,
  createCountry,
  deleteGenre,
  deleteCountry,
} = require("../controllers/movieController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const adminOnly = [authMiddleware, roleMiddleware("admin")];

// CẤU HÌNH MULTER: Định nghĩa nơi lưu trữ và cách đặt tên file ảnh tải lên
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Chỉ định ném file vào thư mục public/uploads nằm ngoài src
    cb(null, path.join(__dirname, "../../public/uploads"));
  },
  filename: (req, file, cb) => {
    // Đặt tên file bằng thời gian hiện tại nối với tên gốc để tránh trùng lặp file
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// ROUTES CẤU HÌNH MỚI: Thêm middleware upload.single("poster") vào router POST và PUT
router.get("/", getMovies);
router.get("/search", searchMovies);
router.get("/:id", getMovieById);

router.post("/", adminOnly, upload.single("poster"), createMovie);
router.put("/:id", adminOnly, upload.single("poster"), updateMovie);
router.delete("/:id", adminOnly, deleteMovie);

router.get("/config/genres", getGenres);
router.post("/config/genres", adminOnly, createGenre);
router.get("/config/countries", getCountries);
router.post("/config/countries", adminOnly, createCountry);
router.delete("/config/genres/:id", adminOnly, deleteGenre);
router.delete("/config/countries/:id", adminOnly, deleteCountry);

module.exports = router;
