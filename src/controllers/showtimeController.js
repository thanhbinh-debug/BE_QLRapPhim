const { Showtime, Movie, Room, Seat } = require("../models");
const { Op } = require("sequelize");

// Lấy lịch chiếu — lọc theo phim và ngày
const getShowtimes = async (req, res) => {
  try {
    const { movieId, date } = req.query;
    // ?movieId=1&date=2024-12-01

    const where = {};
    if (movieId) where.movie_id = movieId;

    // Lọc theo ngày nếu có
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      where.start_time = { [Op.gte]: start, [Op.lt]: end };
    }

    const showtimes = await Showtime.findAll({
      where,
      include: [
        { model: Movie, attributes: ["id", "title", "poster", "duration"] },
        { model: Room, attributes: ["id", "name", "screen_type"] },
      ],
      order: [["start_time", "ASC"]],
    });

    res.json(showtimes);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Lấy chi tiết 1 suất chiếu
const getShowtimeById = async (req, res) => {
  try {
    const showtime = await Showtime.findByPk(req.params.id, {
      include: [
        {
          model: Movie,
          attributes: ["id", "title", "poster", "duration", "genre"],
        },
        {
          model: Room,
          attributes: ["id", "name", "screen_type", "capacity"],
          include: [
            {
              model: Seat, // Sử dụng trực tiếp Seat đã import ở trên[cite: 2]
              as: "Seats",
              attributes: ["id", "row", "number", "type", "status"],
            },
          ],
        },
      ],
    });

    if (!showtime)
      return res.status(404).json({ message: "Không tìm thấy suất chiếu" });
    res.json(showtime);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Thêm suất chiếu (admin)
// const createShowtime = async (req, res) => {
//   try {
//     const { movie_id, room_id, start_time, price, price_vip } = req.body;

//     // Kiểm tra phim và phòng tồn tại
//     const movie = await Movie.findByPk(movie_id);
//     if (!movie) return res.status(404).json({ message: "Không tìm thấy phim" });

//     const room = await Room.findByPk(room_id);
//     if (!room) return res.status(404).json({ message: "Không tìm thấy phòng" });

//     // Tự tính end_time = start_time + duration phim
//     const start = new Date(start_time);
//     const end = new Date(start.getTime() + movie.duration * 60 * 1000);

//     // Kiểm tra phòng có bị trùng lịch không
//     const conflict = await Showtime.findOne({
//       where: {
//         room_id,
//         [Op.or]: [
//           { start_time: { [Op.between]: [start, end] } },
//           { end_time: { [Op.between]: [start, end] } },
//         ],
//       },
//     });

//     if (conflict) {
//       return res
//         .status(400)
//         .json({ message: "Phòng đã có suất chiếu trong khung giờ này" });
//     }

//     const showtime = await Showtime.create({
//       movie_id,
//       room_id,
//       start_time: start,
//       end_time: end,
//       price,
//       price_vip,
//     });

//     res.status(201).json({ message: "Thêm suất chiếu thành công", showtime });
//   } catch (err) {
//     res.status(500).json({ message: "Lỗi server", error: err.message });
//   }
// };

const createShowtime = async (req, res) => {
  try {
    const {
      movie_id,
      room_id,
      start_time,
      price,
      price_vip,
      is_auto,
      buffer_time,
      end_day_time,
    } = req.body;

    const movie = await Movie.findByPk(movie_id);
    if (!movie) return res.status(404).json({ message: "Không tìm thấy phim" });

    const room = await Room.findByPk(room_id);
    if (!room) return res.status(404).json({ message: "Không tìm thấy phòng" });

    let showtimesToCreate = [];

    // Ép kiểu chuẩn để tính toán chính xác
    let currentStartMs = new Date(start_time).getTime();
    const durationMs = parseInt(movie.duration) * 60 * 1000;
    const bufferMs = (parseInt(buffer_time) || 15) * 60 * 1000;

    if (is_auto) {
      const limitMs = new Date(end_day_time).getTime();

      // Vòng lặp dựa trên miliseconds để chính xác tuyệt đối
      while (currentStartMs + durationMs <= limitMs) {
        let currentEndMs = currentStartMs + durationMs;

        // Kiểm tra xung đột (Dùng Date object cho Sequelize Op.between)
        const conflict = await Showtime.findOne({
          where: {
            room_id,
            [Op.or]: [
              {
                start_time: {
                  [Op.between]: [
                    new Date(currentStartMs),
                    new Date(currentEndMs),
                  ],
                },
              },
              {
                end_time: {
                  [Op.between]: [
                    new Date(currentStartMs),
                    new Date(currentEndMs),
                  ],
                },
              },
            ],
          },
        });

        if (!conflict) {
          showtimesToCreate.push({
            movie_id,
            room_id,
            start_time: new Date(currentStartMs),
            end_time: new Date(currentEndMs),
            price,
            price_vip,
          });
        }

        // Bước nhảy: Kết thúc suất này + thời gian nghỉ
        currentStartMs = currentEndMs + bufferMs;
      }
    } else {
      // Logic 1 suất đơn lẻ
      const endMs = currentStartMs + durationMs;
      showtimesToCreate.push({
        movie_id,
        room_id,
        start_time: new Date(currentStartMs),
        end_time: new Date(endMs),
        price,
        price_vip,
      });
    }

    if (showtimesToCreate.length === 0) {
      return res.status(400).json({
        message:
          "Không có suất chiếu nào được tạo. Vui lòng kiểm tra lại khung giờ hoặc trùng lịch!",
      });
    }

    await Showtime.bulkCreate(showtimesToCreate);

    res.status(201).json({
      message: `Hệ thống đã tự động tạo thành công ${showtimesToCreate.length} suất chiếu.`,
    });
  } catch (err) {
    console.error("Lỗi Create Showtime:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Sửa suất chiếu (admin)
const updateShowtime = async (req, res) => {
  try {
    const showtime = await Showtime.findByPk(req.params.id);
    if (!showtime)
      return res.status(404).json({ message: "Không tìm thấy suất chiếu" });

    await showtime.update(req.body);
    res.json({ message: "Cập nhật suất chiếu thành công", showtime });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Xoá suất chiếu (admin)
const deleteShowtime = async (req, res) => {
  try {
    const showtime = await Showtime.findByPk(req.params.id);
    if (!showtime)
      return res.status(404).json({ message: "Không tìm thấy suất chiếu" });

    await showtime.destroy();
    res.json({ message: "Xoá suất chiếu thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

module.exports = {
  getShowtimes,
  getShowtimeById,
  createShowtime,
  updateShowtime,
  deleteShowtime,
};
