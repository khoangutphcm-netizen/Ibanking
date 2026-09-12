const { z } = require("zod");

const initiateSchema = z.object({
  mssv: z.string().regex(/^[0-9]{6,12}$/, "MSSV không hợp lệ (chỉ gồm 6-12 chữ số)"),
});

const confirmOtpSchema = z.object({
  otpCode: z.string().regex(/^[0-9]{6}$/, "OTP phải gồm đúng 6 chữ số"),
});

const transactionCodeParamSchema = z.object({
  transactionCode: z.string().min(1, "transactionCode là bắt buộc"),
});

module.exports = { initiateSchema, confirmOtpSchema, transactionCodeParamSchema };
