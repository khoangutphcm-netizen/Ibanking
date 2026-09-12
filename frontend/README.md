# Frontend — iBanking Tuition (React + Vite)

## Chạy local

```bash
npm install
cp .env.example .env   # trỏ VITE_API_BASE_URL tới API Gateway, mặc định http://localhost:8080
npm run dev
```

Mặc định chạy ở `http://localhost:5173`, gọi API qua Gateway ở `http://localhost:8080` (nhớ `docker compose up` phần backend trước).

## Cấu trúc

```
src/
  api/client.js         Axios instance, tự đính kèm JWT vào header
  context/AuthContext   Quản lý trạng thái đăng nhập (token lưu localStorage)
  components/           Sidebar/Layout, ProtectedRoute, StatusBadge, Banner
  pages/
    LoginPage           Đăng nhập
    OverviewPage         Thông tin tài khoản + số dư
    PaymentPage           Luồng 3 bước: Tra cứu -> Xác nhận -> OTP
    HistoryPage           Lịch sử giao dịch
  utils/validators.js    Validate input phía client (mirror rule của backend) + format tiền/ngày giờ
```

## Deploy

Build tĩnh, deploy lên Cloudflare Pages hoặc Vercel theo đúng plan:

```bash
npm run build   # xuất ra thư mục dist/
```

Nhớ set biến môi trường `VITE_API_BASE_URL` trỏ tới URL thật của API Gateway khi deploy (vd. Railway).
