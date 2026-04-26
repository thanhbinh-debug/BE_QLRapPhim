const { Payment, Booking, Showtime, Movie, Seat, Food } = require("../models");
const sequelize = require("../config/db");

// Xác nhận thanh toán
const createPayment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { booking_id, method } = req.body;

    // Kiểm tra booking tồn tại và thuộc về user
    const booking = await Booking.findOne({
      where: { id: booking_id, user_id: req.user.id },
    });

    if (!booking) {
      await t.rollback();
      return res.status(404).json({ message: "Không tìm thấy vé" });
    }

    if (booking.status === "cancelled") {
      await t.rollback();
      return res.status(400).json({ message: "Vé này đã bị huỷ" });
    }

    if (booking.status === "confirmed") {
      await t.rollback();
      return res.status(400).json({ message: "Vé này đã được thanh toán rồi" });
    }

    // Kiểm tra chưa có payment cho booking này
    const existing = await Payment.findOne({ where: { booking_id } });
    if (existing && existing.status === "paid") {
      await t.rollback();
      return res.status(400).json({ message: "Booking này đã thanh toán" });
    }

    // Tạo payment
    const payment = await Payment.create(
      {
        booking_id,
        amount: booking.total_price,
        method,
        status: "paid",
        paid_at: new Date(),
      },
      { transaction: t },
    );

    // Cập nhật trạng thái booking → confirmed
    await booking.update({ status: "confirmed" }, { transaction: t });

    await t.commit();

    res.status(201).json({
      message: "Thanh toán thành công",
      payment: {
        id: payment.id,
        booking_id,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        paid_at: payment.paid_at,
      },
    });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Lịch sử mua vé của user
const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      include: [
        {
          model: Booking,
          where: { user_id: req.user.id },
          include: [
            {
              model: Showtime,
              include: [{ model: Movie, attributes: ["title", "poster"] }],
            },
            { model: Seat, attributes: ["row", "number", "type"] },
            { model: Food, attributes: ["name", "price"] },
          ],
        },
      ],
      order: [["paid_at", "DESC"]],
    });

    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Lấy tất cả payment (admin)
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      include: [
        {
          model: Booking,
          include: [
            {
              model: Showtime,
              include: [{ model: Movie, attributes: ["title"] }],
            },
          ],
        },
      ],
      order: [["paid_at", "DESC"]],
    });

    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

module.exports = { createPayment, getPaymentHistory, getAllPayments };
