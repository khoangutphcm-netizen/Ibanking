import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { validateUsername, validatePassword } from "../utils/validators";
import Banner from "../components/Banner";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    const errors = {
      username: validateUsername(username),
      password: validatePassword(password),
    };
    setFieldErrors(errors);
    if (errors.username || errors.password) return;

    setSubmitting(true);
    const result = await login(username.trim(), password);
    setSubmitting(false);

    if (!result.success) {
      setFormError(result.message);
      return;
    }
    navigate("/", { replace: true });
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="brand">
          <h1>iBanking — Đóng học phí</h1>
          <p>Đăng nhập để tra cứu và thanh toán học phí</p>
        </div>

        <Banner type="danger">{formError}</Banner>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
            {fieldErrors.username && <div className="field-error">{fieldErrors.username}</div>}
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}
          </div>

          <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: "100%" }}>
            {submitting ? <span className="spinner" /> : "Đăng nhập"}
          </button>
        </form>

        <p className="hint">Tài khoản demo: khoa / 123456</p>
      </div>
    </div>
  );
}
