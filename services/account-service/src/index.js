const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const validate = require("./validate");
const requireUserId = require("./requireUserId");
const { usernameParamSchema, idParamSchema, debitSchema, creditSchema } = require("./schemas");

const app = express();
const prisma = new PrismaClient();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3002;

app.get("/health", (req, res) => res.json({ status: "ok", service: "account-service" }));

// ---- Endpoint nội bộ (chỉ gọi giữa các service, KHÔNG expose qua Gateway) ----

app.get(
  "/internal/users/by-username/:username",
  validate(usernameParamSchema, "params"),
  async (req, res) => {
    const user = await prisma.user.findUnique({ where: { username: req.params.username } });
    if (!user) return res.status(404).json({ error: "Not found" });
    res.json(user);
  }
);

// Saga step: trừ tiền, có optimistic lock qua cột version
app.post(
  "/internal/users/:id/debit",
  validate(idParamSchema, "params"),
  validate(debitSchema),
  async (req, res) => {
    const userId = req.params.id;
    const { amount, expectedVersion } = req.body;

    try {
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw { code: "NOT_FOUND" };
        if (Number(user.balance) < amount) throw { code: "INSUFFICIENT_BALANCE" };

        const updated = await tx.user.updateMany({
          where: { id: userId, version: expectedVersion },
          data: { balance: { decrement: amount }, version: { increment: 1 } },
        });

        if (updated.count === 0) throw { code: "VERSION_CONFLICT" };
        return tx.user.findUnique({ where: { id: userId } });
      });

      res.json({ success: true, newBalance: result.balance, newVersion: result.version });
    } catch (err) {
      if (err.code === "NOT_FOUND") return res.status(404).json({ error: "User không tồn tại" });
      if (err.code === "INSUFFICIENT_BALANCE") return res.status(422).json({ error: "Không đủ số dư" });
      if (err.code === "VERSION_CONFLICT") return res.status(409).json({ error: "Xung đột dữ liệu (version), thử lại" });
      console.error(err);
      res.status(500).json({ error: "Lỗi hệ thống" });
    }
  }
);

// Compensating action: hoàn tiền khi Saga thất bại
app.post(
  "/internal/users/:id/credit",
  validate(idParamSchema, "params"),
  validate(creditSchema),
  async (req, res) => {
    const userId = req.params.id;
    const { amount } = req.body;
    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { balance: { increment: amount }, version: { increment: 1 } },
      });
      res.json({ success: true, newBalance: updated.balance });
    } catch (err) {
      res.status(404).json({ error: "User không tồn tại" });
    }
  }
);

// ---- Endpoint public (qua Gateway, cần JWT) ----

app.get("/api/accounts/me", requireUserId, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ error: "Không tìm thấy user" });
  const { passwordHash, ...safe } = user;
  res.json(safe);
});

app.get("/api/accounts/me/transactions", requireUserId, async (req, res) => {
  // Placeholder — lịch sử thật nằm ở Payment Service (GET /api/payments/history)
  res.status(501).json({ error: "Dùng GET /api/payments/history thay cho endpoint này" });
});

app.listen(PORT, () => console.log(`Account Service listening on port ${PORT}`));
