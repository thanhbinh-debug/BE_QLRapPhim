// const express = require("express");
// const router = express.Router();
// const {
//   getMovies,
//   searchMovies,
//   getMovieById,
//   createMovie,
//   updateMovie,
//   deleteMovie,
// } = require("../controllers/movieController");
// const authMiddleware = require("../middlewares/authMiddleware");
// const roleMiddleware = require("../middlewares/roleMiddleware");

// // Cấu hình multer để xử lý upload ảnh
// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");

// // Cấu hình lưu trữ file ảnh
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadPath = path.join(__dirname, "../../public/uploads");
//     // Kiểm tra nếu thư mục public/uploads chưa có thì tự động tạo mới
//     if (!fs.existsSync(uploadPath)) {
//       fs.mkdirSync(uploadPath, { recursive: true });
//     }
//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => {
//     // Đổi tên file: Thời gian hiện tại + tên file gốc để không bị trùng lặp file cũ
//     cb(null, Date.now() + "-" + file.originalname);
//   },
// });

// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 2 * 1024 * 1024 }, // Tối ưu dung lượng: Giới hạn file tối đa 2MB
//   fileFilter: (req, file, cb) => {
//     // Chỉ cho phép định dạng ảnh png, jpg, jpeg
//     const filetypes = /jpeg|jpg|png/;
//     const extname = filetypes.test(
//       path.extname(file.originalname).toLowerCase(),
//     );
//     const mimetype = filetypes.test(file.mimetype);

//     if (mimetype && extname) {
//       return cb(null, true);
//     }
//     cb(new Error("Chỉ chấp nhận file ảnh định dạng .png, .jpg hoặc .jpeg!"));
//   },
// });

// const adminOnly = [authMiddleware, roleMiddleware("admin")];

// router.get("/", getMovies); // public
// router.get("/search", searchMovies); // public
// router.get("/:id", getMovieById); // public
// router.post("/", adminOnly, upload.single("poster"), createMovie);
// router.put("/:id", adminOnly, upload.single("poster"), updateMovie);
// router.delete("/:id", adminOnly, deleteMovie);

// module.exports = router;

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

module.exports = router;
