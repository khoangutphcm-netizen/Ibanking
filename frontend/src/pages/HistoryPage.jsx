import { useEffect, useState } from "react";
import apiClient, { extractErrorMessage } from "../api/client";
import { formatCurrency, formatDateTime } from "../utils/validators";
import StatusBadge from "../components/StatusBadge";
import Banner from "../components/Banner";

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    apiClient
      .get("/api/payments/history")
      .then(({ data }) => mounted && setHistory(data))
      .catch((err) => mounted && setError(extractErrorMessage(err)))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>Lịch sử giao dịch</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>Các lần thanh toán học phí đã thực hiện</p>

      <Banner type="danger">{error}</Banner>

      <div className="card">
        {loading && <div className="empty-state">Đang tải...</div>}
        {!loading && history.length === 0 && (
          <div className="empty-state">Bạn chưa thực hiện giao dịch nào.</div>
        )}
        {!loading && history.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Mã giao dịch</th>
                <th>MSSV</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.transactionCode}>
                  <td className="tabular">{h.transactionCode}</td>
                  <td>{h.mssv}</td>
                  <td className="tabular">{formatCurrency(h.amount)}</td>
                  <td>
                    <StatusBadge status={h.status} />
                  </td>
                  <td>{formatDateTime(h.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
