const { Seat, Room, Booking, Showtime } = require("../models");
const { Op } = require("sequelize");

// Lấy sơ đồ ghế theo suất chiếu — QUAN TRỌNG
const getSeatsByShowtime = async (req, res) => {
  try {
    const { id: showtimeId } = req.params;

    // Tìm suất chiếu để lấy room_id
    const showtime = await Showtime.findByPk(showtimeId);
    if (!showtime)
      return res.status(404).json({ message: "Không tìm thấy suất chiếu" });

    // Lấy tất cả ghế trong phòng
    const seats = await Seat.findAll({
      where: { room_id: showtime.room_id },
      order: [
        ["row", "ASC"],
        ["number", "ASC"],
      ],
    });

    // Lấy danh sách ghế đã được đặt trong suất chiếu này
    const bookedBookings = await Booking.findAll({
      where: {
        showtime_id: showtimeId,
        status: { [Op.in]: ["pending", "confirmed"] },
      },
      include: [{ model: Seat, attributes: ["id"] }],
    });

    // Gom tất cả seat_id đã đặt vào 1 mảng
    const bookedSeatIds = bookedBookings.flatMap((b) =>
      b.Seats.map((s) => s.id),
    );

    // Gắn trạng thái available / booked cho từng ghế
    const seatMap = seats.map((seat) => ({
      id: seat.id,
      row: seat.row,
      number: seat.number,
      type: seat.type,
      status: bookedSeatIds.includes(seat.id) ? "booked" : "available",
    }));

    res.json({ showtime_id: showtimeId, seats: seatMap });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Tạo ghế cho phòng (admin) — QUAN TRỌNG
const createSeatsForRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    // Nhận mảng cấu hình chi tiết từ Frontend gửi lên
    const { rowsConfig } = req.body;
    // rowsConfig dạng: [{ row: 'A', seatsCount: 10, type: 'vip' }, { row: 'B', seatsCount: 8, type: 'standard' }]

    const room = await Room.findByPk(roomId);
    if (!room) return res.status(404).json({ message: "Không tìm thấy phòng" });

    // 1. Xoá toàn bộ ghế cũ của phòng này nếu có
    await Seat.destroy({ where: { room_id: roomId } });

    const seats = [];
    let totalCapacity = 0; // Biến tính tổng số ghế thực tế để cập nhật phòng

    // 2. Duyệt qua từng cấu hình hàng ghế được gửi lên
    if (rowsConfig && Array.isArray(rowsConfig)) {
      rowsConfig.forEach((config) => {
        const rowLetter = config.row ? config.row.trim().toUpperCase() : "";
        const seatsCount = parseInt(config.seatsCount) || 0;
        const seatType = config.type || "standard"; // 'standard', 'vip', 'couple'

        if (rowLetter && seatsCount > 0) {
          // Vòng lặp tạo số thứ tự ghế từ 1 đến seatsCount của hàng đó
          for (let n = 1; n <= seatsCount; n++) {
            seats.push({
              room_id: roomId,
              row: rowLetter,
              number: n,
              type: seatType,
            });
          }
          totalCapacity += seatsCount; // Cộng dồn sức chứa
        }
      });
    }

    if (seats.length === 0) {
      return res
        .status(400)
        .json({ message: "Cấu hình ghế không hợp lệ hoặc rỗng." });
    }

    // 3. Thực hiện tạo hàng loạt vào database
    await Seat.bulkCreate(seats);

    // 4. Cập nhật sức chứa phòng dựa trên tổng số ghế thực tế tạo ra
    await room.update({ capacity: totalCapacity });

    res.status(201).json({ message: `Tạo ${seats.length} ghế thành công` });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Sửa ghế (admin)
const updateSeat = async (req, res) => {
  try {
    const seat = await Seat.findByPk(req.params.id);
    if (!seat) return res.status(404).json({ message: "Không tìm thấy ghế" });

    await seat.update(req.body);
    res.json({ message: "Cập nhật ghế thành công", seat });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Xoá ghế (admin)
const deleteSeat = async (req, res) => {
  try {
    const seat = await Seat.findByPk(req.params.id);
    if (!seat) return res.status(404).json({ message: "Không tìm thấy ghế" });

    await seat.destroy();
    res.json({ message: "Xoá ghế thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

module.exports = {
  getSeatsByShowtime,
  createSeatsForRoom,
  updateSeat,
  deleteSeat,
};
