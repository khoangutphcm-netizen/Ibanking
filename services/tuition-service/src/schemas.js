const { z } = require("zod");

// MSSV TDTU: 8 chữ số (vd. 52100001). Chỉnh nếu trường bạn dùng định dạng khác.
const mssvParamSchema = z.object({
  mssv: z.string().regex(/^[0-9]{6,12}$/, "MSSV không hợp lệ (chỉ gồm 6-12 chữ số)"),
});

const markPaidSchema = z.object({
  expectedVersion: z.coerce.number().int().nonnegative("expectedVersion không hợp lệ"),
});

module.exports = { mssvParamSchema, markPaidSchema };
