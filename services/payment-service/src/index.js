const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const { PrismaClient } = require("@prisma/client");
const { account, tuition, otp } = require("./serviceClients");
const validate = require("./validate");
const requireUserId = require("./requireUserId");
const { initiateSchema, confirmOtpSchema, transactionCodeParamSchema } = require("./schemas");

const app = express();
const prisma = new PrismaClient();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3004;

app.get("/health", (req, res) => res.json({ status: "ok", service: "payment-service" }));

// ============================================================
// POST /api/payments/initiate  { mssv }
// FSM: [INIT] -> kiểm tra điều kiện -> [PENDING_OTP]
// Rule 1 (Pending Check): chặn nếu user đang có giao dịch pending_otp khác
// ============================================================
app.post("/api/payments/initiate", requireUserId, validate(initiateSchema), async (req, res) => {
  const userId = req.userId;
  const { mssv } = req.body;

  try {
    // --- Rule 1: Pending Check ---
    const pending = await prisma.transaction.findFirst({
      where: { payerUserId: userId, status: "pending_otp" },
    });
    if (pending) {
      return res.status(409).json({
        error: "Bạn đang có giao dịch chưa hoàn tất, vui lòng xử lý xong trước khi tạo giao dịch mới",
        transactionCode: pending.transactionCode,
      });
    }

    // --- Lấy thông tin học phí ---
    let fee;
    try {
      const resp = await tuition.get(`/api/tuition/${mssv}`);
      fee = resp.data;
    } catch (e) {
      if (e.response && e.response.status === 404) throw { code: "TUITION_NOT_FOUND" };
      throw e;
    }
    if (fee.status === "paid") throw { code: "ALREADY_PAID" };

    // --- Lấy thông tin user + kiểm tra số dư ---
    const { data: user } = await account.get("/api/accounts/me", {
      headers: { "x-user-id": userId },
    });
    if (Number(user.balance) < Number(fee.amount)) throw { code: "INSUFFICIENT_BALANCE" };

    // --- Rule 3: Idempotency key ---
    const transactionCode = `TX-${uuidv4()}`;

    const txn = await prisma.transaction.create({
      data: {
        transactionCode,
        payerUserId: userId,
        payerEmail: user.email,
        mssv,
        amount: fee.amount,
        status: "pending_otp",
      },
    });

    // --- Sinh & gửi OTP (5 phút) ---
    await otp.post("/internal/otp/generate", { transactionCode, email: user.email });

    res.status(201).json({ transactionCode, amount: fee.amount, status: txn.status });
  } catch (err) {
    if (err.code === "TUITION_NOT_FOUND") return res.status(404).json({ error: "Không tìm thấy MSSV" });
    if (err.code === "ALREADY_PAID") return res.status(400).json({ error: "Học phí đã được thanh toán" });
    if (err.code === "INSUFFICIENT_BALANCE") return res.status(400).json({ error: "Số dư không đủ" });
    console.error(err.message);
    res.status(500).json({ error: "Lỗi hệ thống" });
  }
});

// ============================================================
// POST /api/payments/:transactionCode/confirm-otp  { otpCode }
// FSM: [PENDING_OTP] -> verify OTP -> Saga (debit -> mark-paid) -> [SUCCESS] | [FAILED] (+ compensate)
// ============================================================
app.post(
  "/api/payments/:transactionCode/confirm-otp",
  requireUserId,
  validate(transactionCodeParamSchema, "params"),
  validate(confirmOtpSchema),
  async (req, res) => {
    const { transactionCode } = req.params;
    const { otpCode } = req.body;

    const txn = await prisma.transaction.findUnique({ where: { transactionCode } });
    if (!txn) return res.status(404).json({ error: "Không tìm thấy giao dịch" });
    if (txn.payerUserId !== req.userId) return res.status(403).json({ error: "Không có quyền với giao dịch này" });
    if (txn.status !== "pending_otp") {
      return res.status(409).json({ error: `Giao dịch đã ở trạng thái ${txn.status}, không thể xử lý lại` });
    }

    // --- Bước 1: verify OTP ---
    try {
      await otp.post("/internal/otp/verify", { transactionCode, otpCode });
    } catch (err) {
      const status = err.response?.status;
      if (status === 410) {
        await prisma.transaction.update({ where: { transactionCode }, data: { status: "failed" } });
        return res.status(410).json({ error: "OTP đã hết hạn, giao dịch bị hủy" });
      }
      return res.status(400).json({ error: "Mã OTP không đúng" });
    }

    // --- Bước 2: Saga — trừ tiền ---
    let debited = false;
    try {
      const { data: user } = await account.get("/api/accounts/me", {
        headers: { "x-user-id": txn.payerUserId },
      });

      await account.post(`/internal/users/${txn.payerUserId}/debit`, {
        amount: txn.amount,
        expectedVersion: user.version,
      });
      debited = true;

      // --- Bước 3: Saga — gạch nợ học phí ---
      const { data: fee } = await tuition.get(`/api/tuition/${txn.mssv}`);
      await tuition.post(`/internal/tuition/${txn.mssv}/mark-paid`, {
        expectedVersion: fee.version,
      });

      // --- Thành công: cập nhật FSM + gửi email xác nhận ---
      const updated = await prisma.transaction.update({
        where: { transactionCode },
        data: { status: "success", completedAt: new Date() },
      });

      await otp.post("/internal/notifications/payment-success", {
        email: txn.payerEmail,
        transactionCode,
        amount: txn.amount,
      });

      return res.json({ status: updated.status });
    } catch (err) {
      if (debited) {
        await account.post(`/internal/users/${txn.payerUserId}/credit`, { amount: txn.amount }).catch(() => {});
      }
      await prisma.transaction.update({ where: { transactionCode }, data: { status: "failed" } });

      const conflict = err.response?.status === 409;
      console.error(err.message);
      return res.status(conflict ? 409 : 500).json({
        error: conflict
          ? "Xung đột dữ liệu (có thể do giao dịch đồng thời), giao dịch đã được hoàn tác"
          : "Lỗi hệ thống, giao dịch đã được hoàn tác",
      });
    }
  }
);

// GET /api/payments/:transactionCode
app.get(
  "/api/payments/:transactionCode",
  requireUserId,
  validate(transactionCodeParamSchema, "params"),
  async (req, res) => {
    const txn = await prisma.transaction.findUnique({ where: { transactionCode: req.params.transactionCode } });
    if (!txn) return res.status(404).json({ error: "Không tìm thấy giao dịch" });
    if (txn.payerUserId !== req.userId) return res.status(403).json({ error: "Không có quyền với giao dịch này" });
    res.json(txn);
  }
);

// GET /api/payments/history — lịch sử giao dịch của user đang đăng nhập
app.get("/api/payments/history", requireUserId, async (req, res) => {
  const history = await prisma.transaction.findMany({
    where: { payerUserId: req.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json(history);
});

app.listen(PORT, () => console.log(`Payment Service listening on port ${PORT}`));
