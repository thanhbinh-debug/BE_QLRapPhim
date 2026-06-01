// Thay đổi dòng import đầu file:
const { Movie, Genre, Country } = require("../models"); // Cập nhật đường dẫn tới file chứa model của bạn
const { Op } = require("sequelize");

// --- CÁC HÀM XỬ LÝ LẤY DỮ LIỆU ĐỘNG ---

// --- GIỮ NGUYÊN CÁC HÀM CŨ CỦA BẠN (getMovies, createMovie, updateMovie...) ---
// const getMovies = async (req, res) => {
//   try {
//     // Nhận tham số status và admin_manage từ query string
//     const { status, admin_manage } = req.query;
//     const where = {};

//     // Nếu KHÔNG PHẢI là trang quản lý của Admin (tức là User hoặc ô Thêm suất chiếu)
//     // thì mới áp dụng bộ lọc ẩn phim đã hết hạn
//     if (admin_manage !== "true") {
//       const today = new Date().toISOString().slice(0, 10);

//       // SỬA CÚ PHÁP ĐÚNG Ở ĐÂY: Gán thuộc tính [Op.or] vào object where
//       where[Op.or] = [{ end_date: { [Op.gte]: today } }, { end_date: null }];
//     }

//     // Lọc theo trạng thái phim nếu phía Client có truyền lên
//     if (status) {
//       where.status = status;
//     }

//     const movies = await Movie.findAll({
//       where,
//       order: [["createdAt", "DESC"]],
//     });

//     res.json(movies);
//   } catch (err) {
//     res.status(500).json({ message: "Lỗi server", error: err.message });
//   }
// };

const getMovies = async (req, res) => {
  try {
    const { status, admin_manage } = req.query;
    let where = {};

    // Chỉ khi admin_manage === "true" (Trang quản lý phim) thì mới hiện TẤT CẢ.
    // Còn lại (User, Admin Thêm suất chiếu) thì bắt buộc phải ẩn phim quá hạn đi.
    if (admin_manage !== "true") {
      const today = new Date().toISOString().slice(0, 10);
      where[Op.or] = [{ end_date: { [Op.gte]: today } }, { end_date: null }];
    }

    // Lọc theo trạng thái phim (now_showing / coming_soon) nếu phía client yêu cầu
    if (status) {
      where.status = status;
    }

    const movies = await Movie.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    res.json(movies || []);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

const searchMovies = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: "Thiếu từ khoá tìm kiếm" });
    const movies = await Movie.findAll({
      where: { title: { [Op.like]: `%${q}%` } },
    });
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

const getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findByPk(req.params.id);
    if (!movie) return res.status(404).json({ message: "Không tìm thấy phim" });
    res.json(movie);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

const createMovie = async (req, res) => {
  try {
    const {
      title,
      description,
      genre,
      duration,
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
    const posterPath = req.file ? `/uploads/${req.file.filename}` : null;
    const movie = await Movie.create({
      title,
      description,
      genre,
      duration,
      poster: posterPath,
      trailer_url,
      status,
      release_date,
      end_date,
      copyright_cost,
      rating,
      director,
      cast,
      country,
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
    const updateData = { ...req.body };
    delete updateData.poster;
    if (req.file) {
      updateData.poster = `/uploads/${req.file.filename}`;
    } else if (req.body.poster && typeof req.body.poster === "string") {
      updateData.poster = req.body.poster;
    }
    await movie.update(updateData);
    res.json({ message: "Cập nhật phim thành công", movie });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

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

// Lấy toàn bộ danh sách thể loại
const getGenres = async (req, res) => {
  try {
    const genres = await Genre.findAll({ order: [["name", "ASC"]] });
    res.json(genres);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi lấy danh sách thể loại", error: err.message });
  }
};

// Thêm một thể loại mới
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

// Lấy toàn bộ danh sách quốc gia
const getCountries = async (req, res) => {
  try {
    const countries = await Country.findAll({ order: [["name", "ASC"]] });
    res.json(countries);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi lấy danh sách quốc gia", error: err.message });
  }
};

// Thêm một quốc gia mới
const createCountry = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name)
      return res.status(400).json({ message: "Tên quốc gia không được trống" });

    const [country, created] = await Country.findOrCreate({
      where: { name: name.trim() },
    });
    if (!created)
      return res.status(400).json({ message: "Quốc gia này đã tồn tại" });

    res.status(201).json({ message: "Thêm quốc gia thành công", country });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Thêm vào cuối file movieController.js
const deleteGenre = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Genre.destroy({ where: { id } });
    if (!deleted)
      return res.status(404).json({ message: "Không tìm thấy thể loại" });
    res.json({ message: "Xóa thể loại thành công" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi server khi xóa thể loại", error: err.message });
  }
};

const deleteCountry = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Country.destroy({ where: { id } });
    if (!deleted)
      return res.status(404).json({ message: "Không tìm thấy quốc gia" });
    res.json({ message: "Xóa quốc gia thành công" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi server khi xóa quốc gia", error: err.message });
  }
};

// Hãy nhớ thêm 'deleteGenre' và 'deleteCountry' vào Object module.exports ở đáy file nhé!

module.exports = {
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
};
