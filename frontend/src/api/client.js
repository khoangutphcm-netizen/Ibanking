import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const apiClient = axios.create({ baseURL: BASE_URL });

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Trích message lỗi thống nhất từ mọi response lỗi của backend ({ error: "..." })
export function extractErrorMessage(err) {
  if (err.response && err.response.data && err.response.data.error) {
    return err.response.data.error;
  }
  if (err.message === "Network Error") return "Không kết nối được tới máy chủ";
  return "Đã có lỗi xảy ra, vui lòng thử lại";
}

export default apiClient;
