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

// Tạo ghế hàng loạt cho phòng (admin)
const createSeatsForRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { rows, seatsPerRow, vipRows } = req.body;
    // rows: số hàng (VD: 8)
    // seatsPerRow: số ghế mỗi hàng (VD: 10)
    // vipRows: mảng hàng VIP (VD: ['C','D','E'])

    const room = await Room.findByPk(roomId);
    if (!room) return res.status(404).json({ message: "Không tìm thấy phòng" });

    // Xoá ghế cũ nếu có
    await Seat.destroy({ where: { room_id: roomId } });

    const seats = [];
    for (let r = 0; r < rows; r++) {
      const rowLetter = String.fromCharCode(65 + r); // A, B, C...
      const isVip = vipRows?.includes(rowLetter);

      for (let n = 1; n <= seatsPerRow; n++) {
        seats.push({
          room_id: roomId,
          row: rowLetter,
          number: n,
          type: isVip ? "vip" : "standard",
        });
      }
    }

    await Seat.bulkCreate(seats);

    // Cập nhật sức chứa phòng
    await room.update({ capacity: rows * seatsPerRow });

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
