const { Genre, Country } = require("../models");

// Lấy toàn bộ thể loại
const getGenres = async (req, res) => {
  try {
    const genres = await Genre.findAll({ order: [["name", "ASC"]] });
    res.json(genres);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Admin thêm thể loại mới trực tiếp
const createGenre = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name)
      return res.status(400).json({ message: "Tên thể loại không được trống" });

    const [genre, created] = await Genre.findOrCreate({
      where: { name: name.trim() },
    });
    if (!created)
      return res.status(400).json({ message: "Thể loại này đã tồn tại" });

    res.status(201).json({ message: "Thêm thể loại thành công", genre });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Lấy toàn bộ quốc gia
const getCountries = async (req, res) => {
  try {
    const countries = await Country.findAll({ order: [["name", "ASC"]] });
    res.json(countries);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

module.exports = { getGenres, createGenre, getCountries };
