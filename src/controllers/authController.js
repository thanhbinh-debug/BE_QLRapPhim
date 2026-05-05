const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const { User } = require("../models");
const { Op } = require("sequelize");

// Tạo JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
};

// Đăng ký
// const register = async (req, res) => {
//   try {
//     const { name, email, password, phone } = req.body;

//     // Kiểm tra email đã tồn tại chưa
//     const existing = await User.findOne({ where: { email } });
//     if (existing) {
//       return res.status(400).json({ message: "Email đã được sử dụng" });
//     }

//     // Mã hoá mật khẩu
//     const password_hash = await bcrypt.hash(password, 10);

//     // Tạo user mới
//     const user = await User.create({ name, email, password_hash, phone });

//     const token = generateToken(user);

//     res.status(201).json({
//       message: "Đăng ký thành công",
//       token,
//       user: {
//         id: user.id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//       },
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Lỗi server", error: err.message });
//   }
// };

const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // 1. Kiểm tra email đã tồn tại chưa
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "Email đã được sử dụng" });
    }

    // 2. Mã hoá mật khẩu
    const password_hash = await bcrypt.hash(password, 10);

    // 3. THÊM MỚI: Tạo mã xác thực email (email_token)
    const emailToken = crypto.randomBytes(32).toString("hex");

    // 4. CHỈNH SỬA: Tạo user mới với token xác thực
    const user = await User.create({
      name,
      email,
      password_hash,
      phone,
      email_token: emailToken, // Lưu mã xác thực vào DB
    });

    // 5. THÊM MỚI: Gửi email xác thực cho người dùng
    const verifyUrl = `http://localhost:5173/verify-email?token=${emailToken}`;
    const message = `Chào mừng bạn đến với Cine Star! \n\n Vui lòng nhấn vào liên kết dưới đây để kích hoạt tài khoản của bạn: \n\n ${verifyUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Xác thực tài khoản - Cine Star",
        message,
      });

      // 6. QUAN TRỌNG: Xóa phần generateToken và trả về thông báo yêu cầu check mail
      res.status(201).json({
        message:
          "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản trước khi đăng nhập.",
      });
    } catch (mailErr) {
      // Nếu gửi mail lỗi, vẫn thông báo thành công nhưng báo người dùng liên hệ hỗ trợ
      res.status(201).json({
        message:
          "Đăng ký thành công nhưng có lỗi khi gửi email xác thực. Vui lòng liên hệ hỗ trợ.",
      });
    }
  } catch (err) {
    console.error("LỖI ĐĂNG KÝ:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Đăng nhập
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Tìm user theo email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Email hoặc mật khẩu không đúng" });
    }

    if (!user.is_verified) {
      return res
        .status(401)
        .json({ message: "Tài khoản của bạn chưa được xác thực email." });
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Email hoặc mật khẩu không đúng" });
    }

    const token = generateToken(user);

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Lấy thông tin user đang đăng nhập
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password_hash"] }, // không trả về mật khẩu
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// const forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;
//     const user = await User.findOne({ where: { email } }); //[cite: 7]

//     if (!user) {
//       return res
//         .status(404)
//         .json({ message: "Email không tồn tại trong hệ thống" });
//     }

//     // Tạo token ngẫu nhiên
//     const resetToken = crypto.randomBytes(20).toString("hex");

//     // Hash và lưu vào DB (Hạn 10 phút)
//     user.reset_password_token = crypto
//       .createHash("sha256")
//       .update(resetToken)
//       .digest("hex");
//     user.reset_password_expires = Date.now() + 10 * 60 * 1000;

//     await user.save();

//     // Link dẫn tới trang Reset Password ở React (Port 3000)
//     const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

//     const message = `Bạn nhận được email này vì bạn đã yêu cầu đặt lại mật khẩu. \n\n Vui lòng nhấn vào link bên dưới để thực hiện (Link có hiệu lực trong 10 phút): \n\n ${resetUrl}`;

//     try {
//       await sendEmail({
//         email: user.email,
//         subject: "Khôi phục mật khẩu - Cine Star",
//         message,
//       });
//       res.status(200).json({ message: "Email khôi phục đã được gửi" });
//     } catch (err) {
//       user.reset_password_token = null;
//       user.reset_password_expires = null;
//       await user.save();
//       return res.status(500).json({ message: "Không thể gửi email lúc này" });
//     }
//   } catch (err) {
//     res.status(500).json({ message: "Lỗi server", error: err.message });
//   }
// };

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res
        .status(404)
        .json({ message: "Email không tồn tại trong hệ thống" });
    }

    // 1. Tạo mã reset đơn giản (20 ký tự)
    const resetToken = crypto.randomBytes(20).toString("hex");

    // 2. Lưu trực tiếp vào DB (Đảm bảo tên cột khớp hoàn toàn với file User.js)
    user.reset_password_token = resetToken;
    user.reset_password_expires = new Date(Date.now() + 10 * 60 * 1000); // Chuyển về đối tượng Date

    await user.save();

    // 3. Link dẫn về cổng 5173 của Vite/React
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    const message = `Bạn nhận được email này vì bạn đã yêu cầu đặt lại mật khẩu. \n\n Vui lòng nhấn vào link bên dưới để thực hiện (Mã có hiệu lực trong 10 phút): \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Khôi phục mật khẩu - Cine Star",
        message,
      });
      res
        .status(200)
        .json({ message: "Email khôi phục đã được gửi thành công!" });
    } catch (err) {
      user.reset_password_token = null;
      user.reset_password_expires = null;
      await user.save();
      return res
        .status(500)
        .json({ message: "Lỗi khi gửi email, vui lòng thử lại sau" });
    }
  } catch (err) {
    console.error("LỖI FORGOT PASSWORD:", err); // Dòng này giúp bạn soi lỗi ở Terminal
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// 2. Đặt lại mật khẩu
// const resetPassword = async (req, res) => {
//   try {
//     // Hash token nhận được để so khớp với DB
//     const hashedToken = crypto
//       .createHash("sha256")
//       .update(req.params.token)
//       .digest("hex");

//     const user = await User.findOne({
//       where: {
//         reset_password_token: hashedToken,
//         reset_password_expires: { [Op.gt]: Date.now() },
//       },
//     });

//     if (!user) {
//       return res
//         .status(400)
//         .json({ message: "Token không hợp lệ hoặc đã hết hạn" });
//     }

//     // Mã hoá mật khẩu mới[cite: 7]
//     user.password_hash = await bcrypt.hash(req.body.password, 10);
//     user.reset_password_token = null;
//     user.reset_password_expires = null;

//     await user.save();

//     res.status(200).json({ message: "Mật khẩu đã được thay đổi thành công" });
//   } catch (err) {
//     res.status(500).json({ message: "Lỗi server", error: err.message });
//   }
// };

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params; // Lấy token từ URL
    const { password } = req.body;

    const user = await User.findOne({
      where: {
        reset_password_token: token,
        reset_password_expires: { [Op.gt]: new Date() }, // Kiểm tra còn hạn không
      },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Mã xác nhận không hợp lệ hoặc đã hết hạn" });
    }

    // Mã hoá mật khẩu mới
    user.password_hash = await bcrypt.hash(password, 10);
    user.reset_password_token = null;
    user.reset_password_expires = null;

    await user.save();

    res
      .status(200)
      .json({ message: "Đổi mật khẩu thành công! Hãy đăng nhập lại." });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};
// Xác thực Email sau khi đăng ký
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query; // Thường mã xác thực sẽ nằm trên URL dạng ?token=...

    if (!token) {
      return res.status(400).json({ message: "Mã xác thực không hợp lệ" });
    }

    // Tìm user có token khớp
    const user = await User.findOne({ where: { email_token: token } });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Mã xác thực không đúng hoặc đã hết hạn" });
    }

    // Cập nhật trạng thái đã xác thực và xóa token tạm
    user.is_verified = true;
    user.email_token = null;
    await user.save();

    res.status(200).json({
      message: "Xác thực tài khoản thành công! Bạn có thể đăng nhập ngay.",
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
};
