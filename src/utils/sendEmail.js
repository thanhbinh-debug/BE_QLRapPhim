const nodemailer = require("nodemailer");
// const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // 1. Tạo transporter (Người gửi)
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "thanhbinhcoder@gmail.com", // Email bạn dùng để gửi
      pass: " lwfe bqae ygog ncoc",
    },
  });

  // 2. Định nghĩa nội dung email
  const mailOptions = {
    from: "Cine Star <no-reply@cinestar.com>",
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // 3. Thực thi gửi
  await transporter.sendMail(mailOptions);
};

// const sendEmail = async (options) => {
//   const transporter = nodemailer.createTransport({
//     service: "Gmail",
//     auth: {
//       user: "email_cua_ban@gmail.com",
//       pass: "ma_app_password_16_ky_tu",
//     },
//   });

//   const mailOptions = {
//     from: "Cine Star <no-reply@cinestar.com>",
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//   };

//   await transporter.sendEmail(mailOptions);
// };

module.exports = sendEmail;
