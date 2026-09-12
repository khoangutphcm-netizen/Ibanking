const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const { sendOtpEmail, sendSuccessEmail } = require("./mailer");
const validate = require("./validate");
const { generateSchema, verifySchema, notifySuccessSchema } = require("./schemas");

const app = express();
const prisma = new PrismaClient();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3005;
const OTP_TTL_MS = 5 * 60 * 1000; // đúng 5 phút theo đặc tả

function generateNumericOtp(length = 6) {
  let code = "";
  for (let i = 0; i < length; i++) code += Math.floor(Math.random() * 10);
  return code;
}

app.get("/health", (req, res) => res.json({ status: "ok", service: "otp-service" }));

// ---- Internal — gọi bởi Payment Service ----

app.post("/internal/otp/generate", validate(generateSchema), async (req, res) => {
  const { transactionCode, email } = req.body;

  const existing = await prisma.otp.findFirst({
    where: { transactionCode, used: false, expiresAt: { gt: new Date() } },
  });
  if (existing) {
    return res.status(409).json({ error: "Giao dịch này đã có OTP còn hiệu lực" });
  }

  const otpCode = generateNumericOtp(6);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.otp.create({ data: { otpCode, transactionCode, expiresAt } });
  await sendOtpEmail(email, otpCode);

  res.status(201).json({ expiresAt });
});

app.post("/internal/otp/verify", validate(verifySchema), async (req, res) => {
  const { transactionCode, otpCode } = req.body;

  const otp = await prisma.otp.findFirst({
    where: { transactionCode },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) return res.status(400).json({ error: "Không tìm thấy OTP cho giao dịch này" });
  if (otp.used) return res.status(409).json({ error: "OTP đã được sử dụng" });
  if (otp.expiresAt < new Date()) return res.status(410).json({ error: "OTP đã hết hạn" });
  if (otp.otpCode !== otpCode) return res.status(400).json({ error: "Mã OTP không đúng" });

  await prisma.otp.update({ where: { id: otp.id }, data: { used: true } });
  res.json({ valid: true });
});

app.post("/internal/notifications/payment-success", validate(notifySuccessSchema), async (req, res) => {
  const { email, transactionCode, amount } = req.body;
  await sendSuccessEmail(email, transactionCode, amount);
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`OTP Service listening on port ${PORT}`));
