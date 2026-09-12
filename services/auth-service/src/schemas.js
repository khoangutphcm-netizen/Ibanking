const { z } = require("zod");

const loginSchema = z.object({
  username: z.string().trim().min(3, "Username tối thiểu 3 ký tự").max(50),
  password: z.string().min(6, "Password tối thiểu 6 ký tự").max(100),
});

module.exports = { loginSchema };
