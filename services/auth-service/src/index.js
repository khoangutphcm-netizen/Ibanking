const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const bcrypt = require("bcrypt");
const validate = require("./validate");
const { loginSchema } = require("./schemas");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const ACCOUNT_SERVICE_URL = process.env.ACCOUNT_SERVICE_URL || "http://localhost:3002";

app.get("/health", (req, res) => res.json({ status: "ok", service: "auth-service" }));

// POST /api/auth/login  { username, password }
// Auth Service KHÔNG có DB riêng — gọi nội bộ sang Account Service để lấy user + passwordHash.
app.post("/api/auth/login", validate(loginSchema), async (req, res) => {
  const { username, password } = req.body;

  try {
    // Endpoint nội bộ, chỉ Auth Service gọi tới (không public qua Gateway)
    const { data: user } = await axios.get(
      `${ACCOUNT_SERVICE_URL}/internal/users/by-username/${encodeURIComponent(username)}`
    );

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: "Sai username hoặc password" });
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: "8h",
    });

    return res.json({
      token,
      user: { id: user.id, fullName: user.fullName },
    });
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return res.status(401).json({ error: "Sai username hoặc password" });
    }
    console.error(err.message);
    return res.status(500).json({ error: "Lỗi hệ thống" });
  }
});

app.listen(PORT, () => console.log(`Auth Service listening on port ${PORT}`));
