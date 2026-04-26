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
    const { name, category, price, image, description } = req.body;
    const food = await Food.create({
      name,
      category,
      price,
      image,
      description,
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

    await food.update(req.body);
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
