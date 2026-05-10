const { sequelize } = require("../models");

const getDashboardStats = async (req, res) => {
  try {
    // 1. Lấy thông tin lấp đầy ghế (Giữ nguyên)
    const seatStats = await sequelize.query(
      `
      SELECT 
        m.title AS movie_title,
        r.name AS room_name,
        s.start_time,
        r.capacity AS total_seats,
        (SELECT COUNT(*) FROM bookings b WHERE b.showtime_id = s.id AND b.status = 'confirmed') AS booked_seats
      FROM showtimes s
      JOIN movies m ON s.movie_id = m.id
      JOIN rooms r ON s.room_id = r.id
      ORDER BY s.start_time DESC
    `,
      { type: sequelize.QueryTypes.SELECT },
    );

    // 2. Tính doanh thu chi tiết từ Bookings và Booking_foods
    const incomeData = await sequelize.query(
      `
      SELECT 
        (SELECT COALESCE(SUM(total_price), 0) FROM bookings WHERE status = 'confirmed') as ticket_revenue,
        (SELECT COALESCE(SUM(bf.quantity * f.price), 0) 
         FROM booking_foods bf 
         JOIN foods f ON bf.food_id = f.id
         JOIN bookings b ON bf.booking_id = b.id
         WHERE b.status = 'confirmed') as food_revenue,
        (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed') as total_tickets
    `,
      { type: sequelize.QueryTypes.SELECT },
    );

    const report = incomeData[0];
    const total_revenue =
      Number(report.ticket_revenue) + Number(report.food_revenue);

    res.status(200).json({
      success: true,
      data: {
        seatStats,
        overview: {
          total_revenue,
          ticket_revenue: Number(report.ticket_revenue),
          food_revenue: Number(report.food_revenue),
          total_tickets: report.total_tickets,
        },
      },
    });
  } catch (error) {
    console.error("Lỗi thống kê:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardStats };
