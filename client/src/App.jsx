import { NavLink, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import RequireAuth from "./RequireAuth.jsx";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Transactions from "./pages/Transactions.jsx";
import ChangePassword from "./pages/ChangePassword.jsx";

function AdminShell() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function onLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand">
          <h1>Balaji Inventory</h1>
          <p className="sub">Balaji Enterprise — Admin</p>
        </div>
        <nav className="top-bar__nav">
          <NavLink end className={({ isActive }) => (isActive ? "active" : "")} to="/">
            Home
          </NavLink>
          <NavLink className={({ isActive }) => (isActive ? "active" : "")} to="/transactions">
            Transactions
          </NavLink>
          <NavLink className={({ isActive }) => (isActive ? "active" : "")} to="/change-password">
            Change Password
          </NavLink>
          <button type="button" className="btn btn-ghost btn-sm nav-logout" onClick={onLogout}>
            Sign out
          </button>
        </nav>
      </header>
      <Outlet />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route element={<AdminShell />}>
          <Route path="/" element={<Home />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/change-password" element={<ChangePassword />} />
        </Route>
      </Route>
    </Routes>
  );
}
