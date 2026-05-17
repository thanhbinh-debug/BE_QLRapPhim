const { sequelize } = require("../models");

const getDashboardStats = async (req, res) => {
  try {
    // Lấy tham số lọc từ query string (mặc định nếu không truyền là 7days)
    const { range } = req.query;

    // Khởi tạo các điều kiện thời gian riêng biệt cho từng bảng để tránh lỗi SQL
    let bookingCondition =
      "AND createdAt >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)"; // Dành cho bảng bookings độc lập
    let joinedBookingCondition =
      "AND b.createdAt >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)"; // Dành cho bảng bookings khi có JOIN (b.)
    let lineChartDays = 7; // Số ngày hiển thị trên biểu đồ đường

    if (range === "today") {
      bookingCondition = "AND DATE(createdAt) = CURDATE()";
      joinedBookingCondition = "AND DATE(b.createdAt) = CURDATE()";
      lineChartDays = 1;
    } else if (range === "month") {
      bookingCondition =
        "AND YEAR(createdAt) = YEAR(CURDATE()) AND MONTH(createdAt) = MONTH(CURDATE())";
      joinedBookingCondition =
        "AND YEAR(b.createdAt) = YEAR(CURDATE()) AND MONTH(b.createdAt) = MONTH(CURDATE())";
      lineChartDays = new Date().getDate();
    }

    // 1. Lấy thông tin lấp đầy ghế (Giữ nguyên gốc)
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

    // 2. Doanh thu cho biểu đồ đường (Ép kiểu DATE_FORMAT chuẩn chuỗi YYYY-MM-DD)
    const rawRevenueByDay = await sequelize.query(
      `SELECT DATE_FORMAT(createdAt, '%Y-%m-%d') as date, SUM(total_price) as daily_revenue
       FROM bookings 
       WHERE status = 'confirmed' ${bookingCondition}
       GROUP BY DATE_FORMAT(createdAt, '%Y-%m-%d') ORDER BY date ASC`,
      { type: sequelize.QueryTypes.SELECT },
    );

    // Xử lý lấp đầy các ngày bằng 0 dựa trên số lượng ngày của bộ lọc
    const revenueByDay = [];
    for (let i = lineChartDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      const found = rawRevenueByDay.find((item) => item.date === dateString);

      revenueByDay.push({
        date: dateString,
        daily_revenue: found ? Number(found.daily_revenue) : 0,
      });
    }

    // 3. Doanh thu theo phim (Truyền trực tiếp biến joinedBookingCondition)
    const revenueByMovie = await sequelize.query(
      `SELECT m.title, SUM(b.total_price) as value
       FROM bookings b 
       JOIN showtimes s ON b.showtime_id = s.id 
       JOIN movies m ON s.movie_id = m.id
       WHERE b.status = 'confirmed' ${joinedBookingCondition}
       GROUP BY m.id ORDER BY value DESC LIMIT 5`,
      { type: sequelize.QueryTypes.SELECT },
    );

    // 4. Khung giờ đông khách (Truyền trực tiếp biến joinedBookingCondition)
    const peakHours = await sequelize.query(
      `SELECT HOUR(s.start_time) as hour, COUNT(b.id) as count
       FROM bookings b 
       JOIN showtimes s ON b.showtime_id = s.id
       WHERE b.status = 'confirmed' ${joinedBookingCondition}
       GROUP BY HOUR(s.start_time) ORDER BY hour ASC`,
      { type: sequelize.QueryTypes.SELECT },
    );

    // 5. Cảnh báo kho (Giữ nguyên)
    const lowStockFoods = await sequelize.query(
      `SELECT name, stock FROM foods WHERE stock < 10 AND is_available = 1`,
      { type: sequelize.QueryTypes.SELECT },
    );

    // 6. Tính toán các thẻ tổng quan (Cards)
    const incomeData = await sequelize.query(
      `
      SELECT 
        (SELECT COALESCE(SUM(total_price), 0) FROM bookings WHERE status = 'confirmed' ${bookingCondition}) as ticket_revenue,
        (SELECT COALESCE(SUM(bf.quantity * f.price), 0) 
         FROM booking_foods bf 
         JOIN foods f ON bf.food_id = f.id
         JOIN bookings b ON bf.booking_id = b.id
         WHERE b.status = 'confirmed' ${joinedBookingCondition}) as food_revenue,
        (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed' ${bookingCondition}) as total_tickets,
        (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed') as total_booked_seats,
        (SELECT COALESCE(SUM(r.capacity), 0) FROM showtimes s JOIN rooms r ON s.room_id = r.id) as total_capacity_seats
    `,
      { type: sequelize.QueryTypes.SELECT },
    );

    const report = incomeData[0];
    const total_revenue =
      Number(report.ticket_revenue) + Number(report.food_revenue);

    const totalBooked = Number(report.total_booked_seats);
    const totalCapacity = Number(report.total_capacity_seats);
    const average_occupancy =
      totalCapacity > 0 ? ((totalBooked / totalCapacity) * 100).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      data: {
        seatStats,
        revenueByDay,
        revenueByMovie,
        peakHours,
        lowStockFoods,
        overview: {
          total_revenue,
          ticket_revenue: Number(report.ticket_revenue),
          food_revenue: Number(report.food_revenue),
          total_tickets: report.total_tickets,
          average_occupancy: Number(average_occupancy),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardStats };
