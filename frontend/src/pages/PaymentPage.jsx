import { useState } from "react";
import apiClient, { extractErrorMessage } from "../api/client";
import { validateMssv, validateOtp, formatCurrency } from "../utils/validators";
import Banner from "../components/Banner";

// FSM của UI (khớp với FSM giao dịch phía backend):
// lookup -> confirm -> otp -> done
const STEP = { LOOKUP: "lookup", CONFIRM: "confirm", OTP: "otp", DONE: "done" };

export default function PaymentPage() {
  const [step, setStep] = useState(STEP.LOOKUP);

  const [mssv, setMssv] = useState("");
  const [mssvError, setMssvError] = useState(null);
  const [fee, setFee] = useState(null);

  const [transactionCode, setTransactionCode] = useState(null);
  const [amount, setAmount] = useState(null);

  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState(null);

  const [banner, setBanner] = useState({ type: "danger", message: null });
  const [loading, setLoading] = useState(false);

  function resetFlow() {
    setStep(STEP.LOOKUP);
    setMssv("");
    setFee(null);
    setTransactionCode(null);
    setAmount(null);
    setOtpCode("");
    setBanner({ type: "danger", message: null });
  }

  async function handleLookup(e) {
    e.preventDefault();
    setBanner({ type: "danger", message: null });

    const err = validateMssv(mssv);
    setMssvError(err);
    if (err) return;

    setLoading(true);
    try {
      const { data } = await apiClient.get(`/api/tuition/${mssv.trim()}`);
      setFee(data);
      setStep(STEP.CONFIRM);
    } catch (err) {
      setBanner({ type: "danger", message: extractErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }

  async function handleInitiate() {
    setBanner({ type: "danger", message: null });
    setLoading(true);
    try {
      const { data } = await apiClient.post("/api/payments/initiate", { mssv: mssv.trim() });
      setTransactionCode(data.transactionCode);
      setAmount(data.amount);
      setStep(STEP.OTP);
      setBanner({ type: "amber", message: "Mã OTP đã được gửi tới email của bạn, có hiệu lực trong 5 phút." });
    } catch (err) {
      // Rule 1 (Pending Check): nếu đã có giao dịch dở dang, dẫn thẳng người dùng sang bước nhập OTP của giao dịch đó
      if (err.response?.status === 409 && err.response.data?.transactionCode) {
        const existingCode = err.response.data.transactionCode;
        try {
          const { data: existing } = await apiClient.get(`/api/payments/${existingCode}`);
          setTransactionCode(existing.transactionCode);
          setAmount(existing.amount);
          setStep(STEP.OTP);
          setBanner({ type: "amber", message: "Bạn có 1 giao dịch chưa hoàn tất, vui lòng nhập OTP để tiếp tục." });
          return;
        } catch {
          // rơi xuống hiển thị lỗi mặc định bên dưới
        }
      }
      setBanner({ type: "danger", message: extractErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmOtp(e) {
    e.preventDefault();
    setBanner({ type: "danger", message: null });

    const err = validateOtp(otpCode);
    setOtpError(err);
    if (err) return;

    setLoading(true);
    try {
      await apiClient.post(`/api/payments/${transactionCode}/confirm-otp`, { otpCode: otpCode.trim() });
      setStep(STEP.DONE);
    } catch (err) {
      setBanner({ type: "danger", message: extractErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>Thanh toán học phí</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
        Tra cứu MSSV, xác nhận và nhập OTP để hoàn tất
      </p>

      <Banner type={banner.type}>{banner.message}</Banner>

      {step === STEP.LOOKUP && (
        <div className="card">
          <h2>Bước 1 — Tra cứu học phí</h2>
          <form onSubmit={handleLookup} noValidate>
            <div className="field">
              <label htmlFor="mssv">Mã số sinh viên (MSSV)</label>
              <input
                id="mssv"
                value={mssv}
                onChange={(e) => setMssv(e.target.value)}
                placeholder="vd. 52100001"
              />
              {mssvError && <div className="field-error">{mssvError}</div>}
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : "Tra cứu"}
            </button>
          </form>
        </div>
      )}

      {step === STEP.CONFIRM && fee && (
        <div className="card">
          <h2>Bước 2 — Xác nhận thanh toán</h2>
          <table style={{ marginBottom: 18 }}>
            <tbody>
              <tr>
                <th>MSSV</th>
                <td>{fee.mssv}</td>
              </tr>
              <tr>
                <th>Sinh viên</th>
                <td>{fee.studentName}</td>
              </tr>
              <tr>
                <th>Số tiền cần đóng</th>
                <td className="tabular">{formatCurrency(fee.amount)}</td>
              </tr>
            </tbody>
          </table>

          {fee.status === "paid" ? (
            <Banner type="success">Khoản học phí này đã được thanh toán.</Banner>
          ) : (
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" onClick={handleInitiate} disabled={loading}>
                {loading ? <span className="spinner" /> : "Xác nhận thanh toán"}
              </button>
              <button className="btn btn-secondary" onClick={resetFlow} disabled={loading}>
                Hủy
              </button>
            </div>
          )}
        </div>
      )}

      {step === STEP.OTP && (
        <div className="card">
          <h2>Bước 3 — Xác thực OTP</h2>
          <p style={{ marginBottom: 16, color: "var(--text-muted)" }}>
            Số tiền: <strong className="tabular">{formatCurrency(amount)}</strong> · Mã giao dịch:{" "}
            <span className="tabular">{transactionCode}</span>
          </p>
          <form onSubmit={handleConfirmOtp} noValidate>
            <div className="field">
              <label htmlFor="otp">Mã OTP (6 chữ số)</label>
              <input
                id="otp"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="••••••"
              />
              {otpError && <div className="field-error">{otpError}</div>}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? <span className="spinner" /> : "Xác nhận"}
              </button>
              <button className="btn btn-secondary" type="button" onClick={resetFlow} disabled={loading}>
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {step === STEP.DONE && (
        <div className="card">
          <Banner type="success">Thanh toán học phí thành công! Email xác nhận đã được gửi.</Banner>
          <button className="btn btn-secondary" onClick={resetFlow}>
            Thực hiện giao dịch khác
          </button>
        </div>
      )}
    </div>
  );
}
