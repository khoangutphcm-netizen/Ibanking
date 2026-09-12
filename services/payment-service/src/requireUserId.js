function requireUserId(req, res, next) {
  const userId = Number(req.headers["x-user-id"]);
  if (!userId || Number.isNaN(userId) || userId <= 0) {
    return res.status(401).json({ error: "Thiếu hoặc sai định danh người dùng" });
  }
  req.userId = userId;
  next();
}
module.exports = requireUserId;
