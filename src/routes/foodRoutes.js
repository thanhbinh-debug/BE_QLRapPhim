const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

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

// CẤU HÌNH MULTER: Lưu ảnh đồ ăn vào public/uploads nằm ngoài thư mục src
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../public/uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

router.get("/", getFoods);
router.get("//:id", getFoodById);

// THÊM MIDDLEWARE UPLOAD: Hứng file với key gửi lên tên là "image"
router.post("/", adminOnly, upload.single("image"), createFood);
router.put("/:id", adminOnly, upload.single("image"), updateFood);
router.delete("/:id", adminOnly, deleteFood);

module.exports = router;
