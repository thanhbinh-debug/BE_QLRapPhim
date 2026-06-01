const { Food } = require("../models");

// Lấy menu đồ ăn
const getFoods = async (req, res) => {
  try {
    const { category } = req.query;
    // ?category=popcorn | drink | combo

    const where = {};
    if (category) where.category = category;

    const foods = await Food.findAll({
      where,
      order: [
        ["category", "ASC"],
        ["name", "ASC"],
      ],
    });

    res.json(foods);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Lấy chi tiết 1 món
const getFoodById = async (req, res) => {
  try {
    const food = await Food.findByPk(req.params.id);
    if (!food) return res.status(404).json({ message: "Không tìm thấy món" });
    res.json(food);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Thêm món (admin)
const createFood = async (req, res) => {
  try {
    const { name, category, price, description, stock } = req.body;

    // ĐỒNG BỘ: Lấy đúng đường dẫn file ảnh từ Multer
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const food = await Food.create({
      name,
      category,
      price,
      image: imagePath, // Lưu đường dẫn tương đối vào database
      description,
      stock: stock || 0,
    });
    res.status(201).json({ message: "Thêm món thành công", food });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Sửa món (admin)
const updateFood = async (req, res) => {
  try {
    const food = await Food.findByPk(req.params.id);
    if (!food) return res.status(404).json({ message: "Không tìm thấy món" });

    const updateData = { ...req.body };
    delete updateData.image; // Xóa dữ liệu tạp chất text gửi lên từ body

    // ĐỒNG BỘ: Nếu chọn file mới thì lấy tên file từ multer, nếu không thì giữ link cũ
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    } else if (req.body.image && typeof req.body.image === "string") {
      updateData.image = req.body.image;
    }

    await food.update(updateData);
    res.json({ message: "Cập nhật món thành công", food });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Xoá món (admin)
const deleteFood = async (req, res) => {
  try {
    const food = await Food.findByPk(req.params.id);
    if (!food) return res.status(404).json({ message: "Không tìm thấy món" });

    await food.destroy();
    res.json({ message: "Xoá món thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

module.exports = { getFoods, getFoodById, createFood, updateFood, deleteFood };
