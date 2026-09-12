const nodemailer = require("nodemailer");

// Cấu hình SMTP qua Gmail API / MailChannel — điền thông tin thật trong .env khi deploy
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendOtpEmail(to, otpCode) {
  if (!process.env.SMTP_USER) {
    console.log(`[MOCK EMAIL] Gửi OTP ${otpCode} tới ${to} (chưa cấu hình SMTP_USER)`);
    return;
  }
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: "Mã OTP xác thực giao dịch đóng học phí",
    text: `Mã OTP của bạn là: ${otpCode}. Mã có hiệu lực trong 5 phút.`,
  });
}

async function sendSuccessEmail(to, transactionCode, amount) {
  if (!process.env.SMTP_USER) {
    console.log(`[MOCK EMAIL] Giao dịch ${transactionCode} thành công (${amount}) gửi tới ${to}`);
    return;
  }
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: "Thanh toán học phí thành công",
    text: `Giao dịch ${transactionCode} với số tiền ${amount} đã được xử lý thành công.`,
  });
}

module.exports = { sendOtpEmail, sendSuccessEmail };
