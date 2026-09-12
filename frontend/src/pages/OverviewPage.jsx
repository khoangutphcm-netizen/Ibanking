import { useEffect, useState } from "react";
import apiClient, { extractErrorMessage } from "../api/client";
import { formatCurrency } from "../utils/validators";
import Banner from "../components/Banner";

export default function OverviewPage() {
  const [account, setAccount] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    apiClient
      .get("/api/accounts/me")
      .then(({ data }) => mounted && setAccount(data))
      .catch((err) => mounted && setError(extractErrorMessage(err)))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>Tổng quan</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>Thông tin tài khoản của bạn</p>

      <Banner type="danger">{error}</Banner>

      {loading && <div className="empty-state">Đang tải...</div>}

      {account && (
        <>
          <div className="balance-strip">
            <div>
              <div className="label">Số dư khả dụng</div>
              <div className="amount tabular">{formatCurrency(account.balance)}</div>
            </div>
          </div>

          <div className="card">
            <h2>Thông tin cá nhân</h2>
            <table>
              <tbody>
                <tr>
                  <th>Họ và tên</th>
                  <td>{account.fullName}</td>
                </tr>
                <tr>
                  <th>Số điện thoại</th>
                  <td>{account.phone}</td>
                </tr>
                <tr>
                  <th>Email</th>
                  <td>{account.email}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
