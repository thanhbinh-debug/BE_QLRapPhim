const { Showtime, Movie, Room, Seat, Booking } = require("../models");
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
      order: [["start_time", "DESC"]],
    });

    res.json(showtimes);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

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
          include: [{ model: Seat, as: "Seats" }], // Lấy tất cả ghế của phòng
        },
      ],
    });

    if (!showtime)
      return res.status(404).json({ message: "Không tìm thấy suất chiếu" });

    // Lấy danh sách ID các ghế đã được đặt cho RIÊNG suất chiếu này
    const bookedBookings = await Booking.findAll({
      where: {
        showtime_id: req.params.id,
        status: { [Op.in]: ["pending", "confirmed"] },
      },
      include: [{ model: Seat, attributes: ["id"] }],
    });

    // Gom tất cả ID ghế đã đặt vào 1 mảng
    const bookedSeatIds = bookedBookings.flatMap((b) =>
      b.Seats.map((s) => s.id),
    );

    // Map lại danh sách ghế để gán trạng thái động
    const seatsWithStatus = showtime.Room.Seats.map((seat) => {
      const seatData = seat.toJSON();
      return {
        ...seatData,
        status: bookedSeatIds.includes(seat.id) ? "booked" : "available",
      };
    });

    // Trả về dữ liệu đã được xử lý
    const response = showtime.toJSON();
    response.Room.Seats = seatsWithStatus;

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};


const createShowtime = async (req, res) => {
  try {
    const {
      movie_id, // Cho suất đơn lẻ
      movie_ids, // Mảng ID phim gửi lên từ checkbox khi bật is_auto
      room_id,
      start_time,
      price,
      price_vip,
      is_auto,
      buffer_time,
      end_day_time,
    } = req.body;

    const room = await Room.findByPk(room_id);
    if (!room) return res.status(404).json({ message: "Không tìm thấy phòng" });

    let showtimesToCreate = [];
    let currentStartMs = new Date(start_time).getTime();
    const bufferMs = (parseInt(buffer_time) || 15) * 60 * 1000;

    // Hàm kiểm tra xung đột lịch chiếu dùng chung
    const checkConflict = async (startMs, endMs, roomId) => {
      const startTimeISO = new Date(startMs).toISOString();
      const endTimeISO = new Date(endMs).toISOString();

      return await Showtime.findOne({
        where: {
          room_id: roomId,
          [Op.and]: [
            { start_time: { [Op.lt]: endTimeISO } },
            { end_time: { [Op.gt]: startTimeISO } },
          ],
        },
      });
    };

    // TRƯỜNG HỢP 1: TỰ ĐỘNG XẾP LỊCH XOAY VÒNG NHIỀU PHIM KHÁC NHAU VÀO 1 PHÒNG
    if (is_auto) {
      if (!movie_ids || !Array.isArray(movie_ids) || movie_ids.length === 0) {
        return res
          .status(400)
          .json({ message: "Vui lòng chọn danh sách bộ phim cần xếp lịch." });
      }

      // Lấy thông tin thời lượng (duration) của tất cả phim được chọn trong mảng ID
      const moviesList = await Movie.findAll({
        where: { id: { [Op.in]: movie_ids } },
        attributes: ["id", "title", "duration"],
      });

      if (moviesList.length === 0) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy thông tin các bộ phim đã chọn." });
      }

      const limitMs = new Date(end_day_time).getTime();
      let movieIndex = 0; // Biến con trỏ phục vụ xoay vòng danh sách phim

      // Vòng lặp chạy gối đầu liên tục cho đến khi vượt mốc kết thúc ngày
      while (true) {
        // Lấy bộ phim hiện tại trong hàng đợi xoay vòng
        const currentMovie = moviesList[movieIndex];
        const durationMs = parseInt(currentMovie.duration) * 60 * 1000;
        let currentEndMs = currentStartMs + durationMs;

        // Nếu suất chiếu này vượt quá giờ kết thúc ngày được cấu hình thì dừng nghỉ hoàn toàn
        if (currentEndMs > limitMs) {
          break;
        }

        // Kiểm tra xem khung giờ dự kiến gối đầu này có bị trùng với lịch cố định nào trước đó không
        const conflict = await checkConflict(
          currentStartMs,
          currentEndMs,
          room_id,
        );

        if (!conflict) {
          // Khung giờ trống hoàn toàn -> Thêm lịch thành công cho bộ phim này
          showtimesToCreate.push({
            movie_id: currentMovie.id,
            room_id,
            start_time: new Date(currentStartMs),
            end_time: new Date(currentEndMs),
            price,
            price_vip,
          });

          // Bước nhảy thời gian: Kết thúc phim + thời gian dọn dẹp/nghỉ ngơi
          currentStartMs = currentEndMs + bufferMs;

          // Chuyển xoay vòng sang bộ phim tiếp theo trong danh sách mảng
          movieIndex = (movieIndex + 1) % moviesList.length;
        } else {
          // Bị trùng lịch -> Nhảy mốc thời gian vượt qua suất bị trùng + thời gian nghỉ
          console.log(
            `Phát hiện lịch trùng tại phòng, hệ thống tự động nhảy qua lịch trùng...`,
          );
          currentStartMs = new Date(conflict.end_time).getTime() + bufferMs;

          // Giữ nguyên movieIndex để bộ phim này tiếp tục được ưu tiên thử xếp ở khung giờ trống sau
        }
      }
    } else {
      // TRƯỜNG HỢP 2: LÝ LUẬN CHO 1 SUẤT CHIẾU ĐƠN LẺ THỦ CÔNG
      const movie = await Movie.findByPk(movie_id);
      if (!movie)
        return res.status(404).json({ message: "Không tìm thấy phim" });

      const durationMs = parseInt(movie.duration) * 60 * 1000;
      const currentEndMs = currentStartMs + durationMs;

      const conflict = await checkConflict(
        currentStartMs,
        currentEndMs,
        room_id,
      );

      if (conflict) {
        return res.status(400).json({
          message: `Khung giờ này tại phòng ${room.name} đã có phim khác chiếu!`,
        });
      }

      showtimesToCreate.push({
        movie_id,
        room_id,
        start_time: new Date(currentStartMs),
        end_time: new Date(currentEndMs),
        price,
        price_vip,
      });
    }

    if (showtimesToCreate.length === 0) {
      return res.status(400).json({
        message:
          "Không thể tự động tạo suất chiếu nào. Khung giờ này đã kín lịch hoặc thời gian kết thúc ngày quá ngắn.",
      });
    }

    // Tiến hành bulkCreate danh sách suất chiếu hợp lệ vào DB
    await Showtime.bulkCreate(showtimesToCreate);

    res.status(201).json({
      message: `Thành công! Đã thêm ${showtimesToCreate.length} suất chiếu xen kẽ gối đầu vào hệ thống.`,
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
