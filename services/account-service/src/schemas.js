const { z } = require("zod");

const usernameParamSchema = z.object({
  username: z.string().trim().min(3).max(50),
});

const idParamSchema = z.object({
  id: z.coerce.number().int().positive("id không hợp lệ"),
});

const debitSchema = z.object({
  amount: z.coerce.number().positive("Số tiền phải lớn hơn 0"),
  expectedVersion: z.coerce.number().int().nonnegative("expectedVersion không hợp lệ"),
});

const creditSchema = z.object({
  amount: z.coerce.number().positive("Số tiền phải lớn hơn 0"),
});

module.exports = { usernameParamSchema, idParamSchema, debitSchema, creditSchema };
