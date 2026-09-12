const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const validate = require("./validate");
const { mssvParamSchema, markPaidSchema } = require("./schemas");

const app = express();
const prisma = new PrismaClient();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3003;

app.get("/health", (req, res) => res.json({ status: "ok", service: "tuition-service" }));

// ---- Public (qua Gateway) ----
app.get("/api/tuition/:mssv", validate(mssvParamSchema, "params"), async (req, res) => {
  const fee = await prisma.tuitionFee.findUnique({ where: { mssv: req.params.mssv } });
  if (!fee) return res.status(404).json({ error: "Không tìm thấy MSSV" });
  res.json(fee);
});

// ---- Internal (gọi bởi Payment Service) ----

app.post(
  "/internal/tuition/:mssv/mark-paid",
  validate(mssvParamSchema, "params"),
  validate(markPaidSchema),
  async (req, res) => {
    const { expectedVersion } = req.body;
    try {
      const fee = await prisma.tuitionFee.findUnique({ where: { mssv: req.params.mssv } });
      if (!fee) return res.status(404).json({ error: "Không tìm thấy MSSV" });
      if (fee.status === "paid") return res.status(409).json({ error: "Học phí đã được thanh toán trước đó" });

      const updated = await prisma.tuitionFee.updateMany({
        where: { mssv: req.params.mssv, version: expectedVersion, status: "unpaid" },
        data: { status: "paid", version: { increment: 1 } },
      });

      if (updated.count === 0) {
        return res.status(409).json({ error: "Xung đột: học phí vừa được thanh toán bởi giao dịch khác" });
      }
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Lỗi hệ thống" });
    }
  }
);

app.post(
  "/internal/tuition/:mssv/mark-unpaid",
  validate(mssvParamSchema, "params"),
  async (req, res) => {
    try {
      await prisma.tuitionFee.update({
        where: { mssv: req.params.mssv },
        data: { status: "unpaid", version: { increment: 1 } },
      });
      res.json({ success: true });
    } catch (err) {
      res.status(404).json({ error: "Không tìm thấy MSSV" });
    }
  }
);

app.listen(PORT, () => console.log(`Tuition Service listening on port ${PORT}`));
