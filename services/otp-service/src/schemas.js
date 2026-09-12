const { z } = require("zod");

const generateSchema = z.object({
  transactionCode: z.string().min(1, "transactionCode là bắt buộc"),
  email: z.string().email("Email không hợp lệ"),
});

const verifySchema = z.object({
  transactionCode: z.string().min(1, "transactionCode là bắt buộc"),
  otpCode: z.string().regex(/^[0-9]{6}$/, "OTP phải gồm đúng 6 chữ số"),
});

const notifySuccessSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  transactionCode: z.string().min(1),
  amount: z.coerce.number().positive("Số tiền phải lớn hơn 0"),
});

module.exports = { generateSchema, verifySchema, notifySuccessSchema };
