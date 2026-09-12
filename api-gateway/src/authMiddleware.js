const jwt = require("jsonwebtoken");

// Các route không cần JWT (public)
const PUBLIC_PATHS = ["/api/auth/login"];

function authMiddleware(req, res, next) {
  if (PUBLIC_PATHS.some((p) => req.path.startsWith(p))) {
    return next();
  }

  const header = req.headers["authorization"];
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_secret_change_me");
    req.user = payload; // { userId, username }
    // Forward danh tính xuống các service phía sau qua header nội bộ
    req.headers["x-user-id"] = String(payload.userId);
    req.headers["x-username"] = payload.username;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = authMiddleware;
