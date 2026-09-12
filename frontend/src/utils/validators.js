// Validation client-side — chạy trước khi gọi API để phản hồi tức thì cho người dùng.
// Backend vẫn validate lại toàn bộ (không bao giờ tin tưởng dữ liệu từ client).

export function validateUsername(value) {
  if (!value || !value.trim()) return "Vui lòng nhập username";
  if (value.trim().length < 3) return "Username tối thiểu 3 ký tự";
  return null;
}

export function validatePassword(value) {
  if (!value) return "Vui lòng nhập password";
  if (value.length < 6) return "Password tối thiểu 6 ký tự";
  return null;
}

export function validateMssv(value) {
  if (!value || !value.trim()) return "Vui lòng nhập MSSV";
  if (!/^[0-9]{6,12}$/.test(value.trim())) return "MSSV chỉ gồm 6-12 chữ số";
  return null;
}

export function validateOtp(value) {
  if (!value || !value.trim()) return "Vui lòng nhập mã OTP";
  if (!/^[0-9]{6}$/.test(value.trim())) return "OTP gồm đúng 6 chữ số";
  return null;
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(amount));
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN");
}

export const STATUS_LABEL = {
  unpaid: "Chưa đóng",
  paid: "Đã đóng",
  pending_otp: "Chờ OTP",
  success: "Thành công",
  failed: "Thất bại",
  expired: "Hết hạn",
};
