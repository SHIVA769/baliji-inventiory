import { useEffect, useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import PasswordField from "../components/PasswordField.jsx";

export default function Login() {
  const { token, login } = useAuth();
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/login-hint")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setHint(data);
      })
      .catch(() => {
        if (!cancelled) setHint({ hasStoredPassword: false, unavailable: true });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (token) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    if (!password.trim()) {
      setErr("Enter your password.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErr(data.error || r.statusText || "Sign in failed");
        return;
      }
      if (!data.token) {
        setErr("Invalid server response");
        return;
      }
      login(data.token);
      navigate(from, { replace: true });
    } catch (e) {
      setErr(
        e instanceof TypeError
          ? "Cannot reach API. Start the server (port 5000) and try again."
          : e.message || "Sign in failed"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card card">
        <h1 className="login-title">Balaji Inventory</h1>
        <p className="muted login-sub">Balaji Enterprise — Admin sign in</p>
        {err ? <p className="error">{err}</p> : null}
        <form
          className="form-grid"
          onSubmit={onSubmit}
          style={{ maxWidth: "100%" }}
          noValidate
        >
          <PasswordField
            label="Password"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
            disabled={busy}
          />
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <LoginHint hint={hint} />
      </div>
    </div>
  );
}

function LoginHint({ hint }) {
  if (!hint) {
    return (
      <p className="muted login-hint" style={{ fontSize: "0.8rem", marginBottom: 0 }}>
        Loading sign-in help…
      </p>
    );
  }
  if (hint.unavailable) {
    return (
      <p className="muted login-hint" style={{ fontSize: "0.8rem", marginBottom: 0 }}>
        Could not reach the server for hints. If sign-in fails, check that MongoDB is running
        and <code>JWT_SECRET</code> is set in <code>server/.env</code>.
      </p>
    );
  }
  if (hint.hasStoredPassword) {
    return (
      <p className="muted login-hint" style={{ fontSize: "0.8rem", marginBottom: 0 }}>
        Your password is the one you set on <strong>Change password</strong>.{" "}
        <code>ADMIN_PASSWORD</code> in <code>server/.env</code> is{" "}
        <strong>not</strong> used for sign-in anymore—only the value stored in MongoDB.
      </p>
    );
  }
  return (
    <p className="muted login-hint" style={{ fontSize: "0.8rem", marginBottom: 0 }}>
      <strong>First-time / initial access:</strong> use <code>ADMIN_PASSWORD</code> from{" "}
      <code>server/.env</code> (see <code>.env.example</code>), or the development default{" "}
      <code>password1234</code> if the server started without that variable. After you use{" "}
      <strong>Change password</strong> in the app, sign in only with the new password; you do{" "}
      <strong>not</strong> need to update <code>.env</code>.
    </p>
  );
}
