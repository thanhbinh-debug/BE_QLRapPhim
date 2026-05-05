const { Movie } = require("../models");
const { Op } = require("sequelize");

// Lấy danh sách phim (có thể lọc theo status)
const getMovies = async (req, res) => {
  try {
    const { status } = req.query; // ?status=now_showing hoặc coming_soon

    const where = {};
    if (status) where.status = status;

    const movies = await Movie.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Tìm kiếm phim theo tên
const searchMovies = async (req, res) => {
  try {
    const { q } = req.query; // ?q=ten_phim

    if (!q) return res.status(400).json({ message: "Thiếu từ khoá tìm kiếm" });

    const movies = await Movie.findAll({
      where: { title: { [Op.like]: `%${q}%` } },
    });
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Lấy chi tiết 1 phim
const getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findByPk(req.params.id);
    if (!movie) return res.status(404).json({ message: "Không tìm thấy phim" });
    res.json(movie);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Thêm phim mới (admin)
const createMovie = async (req, res) => {
  try {
    const {
      title,
      description,
      genre,
      duration,
      poster,
      trailer_url,
      status,
      release_date,
      rating,
      director,
      cast,
      country, // Nhận thêm dữ liệu
    } = req.body;

    const movie = await Movie.create({
      title,
      description,
      genre,
      duration,
      poster,
      trailer_url,
      status,
      release_date,
      rating,
      director,
      cast,
      country, // Lưu vào DB
    });

    res.status(201).json({ message: "Thêm phim thành công", movie });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Sửa phim (admin)
const updateMovie = async (req, res) => {
  try {
    const movie = await Movie.findByPk(req.params.id);
    if (!movie) return res.status(404).json({ message: "Không tìm thấy phim" });

    await movie.update(req.body);
    res.json({ message: "Cập nhật phim thành công", movie });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Xoá phim (admin)
const deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findByPk(req.params.id);
    if (!movie) return res.status(404).json({ message: "Không tìm thấy phim" });

    await movie.destroy();
    res.json({ message: "Xoá phim thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

module.exports = {
  getMovies,
  searchMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
};
