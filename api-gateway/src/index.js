const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");
const authMiddleware = require("./authMiddleware");

const app = express();
const PORT = process.env.PORT || 8080;

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:3001";
const ACCOUNT_SERVICE_URL = process.env.ACCOUNT_SERVICE_URL || "http://localhost:3002";
const TUITION_SERVICE_URL = process.env.TUITION_SERVICE_URL || "http://localhost:3003";
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || "http://localhost:3004";

app.use(cors());

app.get("/health", (req, res) => res.json({ status: "ok", service: "api-gateway" }));

// JWT check áp dụng cho MỌI request /api/* trừ /api/auth/login (xem authMiddleware.js)
app.use("/api", authMiddleware);

// Định tuyến xuống từng service. Mỗi service tự expose route theo prefix /api/... của chính nó.
app.use("/api/auth", createProxyMiddleware({ target: AUTH_SERVICE_URL, changeOrigin: true }));
app.use("/api/accounts", createProxyMiddleware({ target: ACCOUNT_SERVICE_URL, changeOrigin: true }));
app.use("/api/tuition", createProxyMiddleware({ target: TUITION_SERVICE_URL, changeOrigin: true }));
app.use("/api/payments", createProxyMiddleware({ target: PAYMENT_SERVICE_URL, changeOrigin: true }));

app.listen(PORT, () => console.log(`API Gateway listening on port ${PORT}`));
