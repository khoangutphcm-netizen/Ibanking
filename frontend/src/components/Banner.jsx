// Banner hiển thị lỗi/thành công/cảnh báo — dùng chung cho mọi trang.
export default function Banner({ type = "danger", children }) {
  if (!children) return null;
  return <div className={`banner banner-${type}`}>{children}</div>;
}
