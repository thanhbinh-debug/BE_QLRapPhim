const {
  Booking,
  Showtime,
  Seat,
  Food,
  Payment,
  Movie,
  Room,
} = require("../models");
const { Op } = require("sequelize");
const sequelize = require("../config/db");

// Đặt vé
const createBooking = async (req, res) => {
  // Dùng transaction — nếu 1 bước lỗi thì rollback toàn bộ
  const t = await sequelize.transaction();

  try {
    const { showtime_id, seat_ids, food_items } = req.body;
    // seat_ids:   [1, 2, 3]
    // food_items: [{ food_id: 1, quantity: 2 }, { food_id: 2, quantity: 1 }]

    // 1. Kiểm tra suất chiếu tồn tại
    const showtime = await Showtime.findByPk(showtime_id, {
      include: [{ model: Movie, attributes: ["title"] }],
    });
    if (!showtime) {
      await t.rollback();
      return res.status(404).json({ message: "Không tìm thấy suất chiếu" });
    }

    // 2. Kiểm tra suất chiếu chưa qua
    if (new Date(showtime.start_time) < new Date()) {
      await t.rollback();
      return res.status(400).json({ message: "Suất chiếu này đã qua" });
    }

    // 3. Kiểm tra ghế có bị đặt chưa
    const alreadyBooked = await Booking.findAll({
      where: {
        showtime_id,
        status: { [Op.in]: ["pending", "confirmed"] },
      },
      include: [
        { model: Seat, where: { id: { [Op.in]: seat_ids } }, required: true },
      ],
    });

    if (alreadyBooked.length > 0) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "Một hoặc nhiều ghế đã được đặt" });
    }

    // 4. Lấy thông tin ghế để tính giá
    const seats = await Seat.findAll({ where: { id: { [Op.in]: seat_ids } } });
    if (seats.length !== seat_ids.length) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "Một hoặc nhiều ghế không tồn tại" });
    }

    // 5. Tính tổng tiền ghế
    let totalPrice = 0;
    seats.forEach((seat) => {
      totalPrice +=
        seat.type === "vip"
          ? Number(showtime.price_vip)
          : Number(showtime.price);
    });

    // 6. Tính tiền đồ ăn nếu có
    let foodDetails = [];
    if (food_items && food_items.length > 0) {
      const foodIds = food_items.map((f) => f.food_id);
      const foods = await Food.findAll({ where: { id: { [Op.in]: foodIds } } });

      foodDetails = food_items.map((item) => {
        const food = foods.find((f) => f.id === item.food_id);
        if (!food) throw new Error(`Không tìm thấy món ăn id ${item.food_id}`);
        totalPrice += Number(food.price) * item.quantity;
        return { food_id: food.id, quantity: item.quantity, price: food.price };
      });
    }

    // 7. Tạo booking
    const booking = await Booking.create(
      { user_id: req.user.id, showtime_id, total_price: totalPrice },
      { transaction: t },
    );

    // 8. Gắn ghế vào booking (bảng booking_seats)
    await booking.addSeats(seats, { transaction: t });

    // 9. Gắn đồ ăn vào booking (bảng booking_foods)
    if (foodDetails.length > 0) {
      await Promise.all(
        foodDetails.map(async (item) =>
          sequelize.models.booking_foods
            ? booking.addFood(await Food.findByPk(item.food_id), {
                through: {
                  quantity: item.quantity,
                  price: item.price,
                },
                transaction: t,
              })
            : null,
        ),
      );
    }

    await t.commit();

    res.status(201).json({
      message: "Đặt vé thành công",
      booking: {
        id: booking.id,
        showtime_id,
        total_price: totalPrice,
        status: booking.status,
        seats: seats.map((s) => ({
          id: s.id,
          row: s.row,
          number: s.number,
          type: s.type,
        })),
      },
    });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Lấy vé của user đang đăng nhập
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: Showtime,
          include: [
            { model: Movie, attributes: ["id", "title", "poster"] },
            { model: Room, attributes: ["id", "name"] },
          ],
        },
        { model: Seat, attributes: ["id", "row", "number", "type"] },
        { model: Food, attributes: ["id", "name", "price"] },
        { model: Payment, attributes: ["method", "status", "paid_at"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Lấy chi tiết 1 vé
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id, // chỉ xem vé của chính mình
      },
      include: [
        {
          model: Showtime,
          include: [
            { model: Movie, attributes: ["id", "title", "poster", "duration"] },
            { model: Room, attributes: ["id", "name", "screen_type"] },
          ],
        },
        { model: Seat },
        { model: Food },
        { model: Payment },
      ],
    });

    if (!booking) return res.status(404).json({ message: "Không tìm thấy vé" });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Huỷ vé
const cancelBooking = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const booking = await Booking.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [{ model: Showtime }],
    });

    if (!booking) {
      await t.rollback();
      return res.status(404).json({ message: "Không tìm thấy vé" });
    }

    // Chỉ huỷ được vé chưa confirmed hoặc trước giờ chiếu 1 tiếng
    if (booking.status === "cancelled") {
      await t.rollback();
      return res.status(400).json({ message: "Vé này đã bị huỷ rồi" });
    }

    const oneHourBefore = new Date(booking.Showtime.start_time);
    oneHourBefore.setHours(oneHourBefore.getHours() - 1);

    if (new Date() > oneHourBefore) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "Không thể huỷ vé trước giờ chiếu 1 tiếng" });
    }

    await booking.update({ status: "cancelled" }, { transaction: t });
    await t.commit();

    res.json({ message: "Huỷ vé thành công" });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Lấy tất cả booking (admin)
const getAllBookings = async (req, res) => {
  try {
    const { status, date, movieId } = req.query;

    const where = {};
    if (status) where.status = status;

    const showtimeWhere = {};
    if (movieId) showtimeWhere.movie_id = movieId;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      showtimeWhere.start_time = { [Op.gte]: start, [Op.lt]: end };
    }

    const bookings = await Booking.findAll({
      where,
      include: [
        {
          model: Showtime,
          where: Object.keys(showtimeWhere).length ? showtimeWhere : undefined,
          include: [{ model: Movie, attributes: ["title"] }],
        },
        { model: Seat, attributes: ["row", "number", "type"] },
        { model: Payment, attributes: ["method", "status"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getAllBookings,
};
