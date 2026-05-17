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
      end_date,
      copyright_cost,
      rating,
      director,
      cast,
      country,
    } = req.body;

    // Nếu có file poster được upload, lấy đường dẫn lưu vào DB
    const posterPath = req.file ? `/uploads/${req.file.filename}` : null;

    const movie = await Movie.create({
      title,
      description,
      genre,
      duration,
      poster: posterPath, // Lưu đường dẫn ảnh vào DB
      trailer_url,
      status,
      release_date,
      end_date,
      copyright_cost,
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

const updateMovie = async (req, res) => {
  try {
    const movie = await Movie.findByPk(req.params.id);
    if (!movie) return res.status(404).json({ message: "Không tìm thấy phim" });

    // Tạo bản sao dữ liệu gửi lên từ body
    const updateData = { ...req.body };

    delete updateData.poster; // Xoá trường poster nếu có trong body để tránh ghi đè

    // CHỨC NĂNG: Nếu admin cập nhật ảnh mới thì cập nhật đường dẫn mới, nếu giữ nguyên thì không đè dữ liệu cũ
    if (req.file) {
      updateData.poster = `/uploads/${req.file.filename}`;
    } else if (req.body.poster && typeof req.body.poster === "string") {
      // Nếu không chọn ảnh mới, giữ nguyên đường dẫn chuỗi tĩnh cũ được gửi lên từ form
      updateData.poster = req.body.poster;
    }

    await movie.update(updateData);
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
