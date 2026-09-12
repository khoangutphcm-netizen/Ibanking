import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Tổng quan", end: true },
  { to: "/payment", label: "Thanh toán học phí" },
  { to: "/history", label: "Lịch sử giao dịch" },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          iBank<span>ing</span>
        </div>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
          >
            {l.label}
          </NavLink>
        ))}
        <div className="sidebar-footer">
          <div className="sidebar-user">{user?.fullName}</div>
          <button className="logout-btn" onClick={logout}>
            Đăng xuất
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
