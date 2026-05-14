import { useState } from "react";
import { changePassword } from "../api.js";
import { useToast } from "../hooks/useToast.js";
import ToastStack from "../components/ToastStack.jsx";
import PasswordField from "../components/PasswordField.jsx";

export default function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const { toasts, toast, dismiss } = useToast();

  async function onSubmit(e) {
    e.preventDefault();
    const c = current.trim();
    const n = next.trim();
    const cf = confirm.trim();
    if (!c) {
      toast("Enter your current password.", "error");
      return;
    }
    if (!n) {
      toast("Enter a new password.", "error");
      return;
    }
    if (n.length < 6) {
      toast("New password must be at least 6 characters.", "error");
      return;
    }
    if (!cf) {
      toast("Confirm your new password.", "error");
      return;
    }
    if (n !== cf) {
      toast("New password and confirmation do not match.", "error");
      return;
    }
    setBusy(true);
    try {
      await changePassword({ currentPassword: c, newPassword: n });
      setCurrent("");
      setNext("");
      setConfirm("");
      toast("Password updated. Use your new password next time you sign in.");
    } catch (e) {
      toast(e.message || "Could not update password.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <ToastStack toasts={toasts} onDismiss={dismiss} />
      <section className="card">
        <h2>Change Password</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          After you change it here, future sign-ins use the new password (stored securely in
          MongoDB). Use the eye icon to show or hide each field.
        </p>
        <form
          className="form-grid"
          onSubmit={onSubmit}
          style={{ maxWidth: 360 }}
          noValidate
        >
          <PasswordField
            label="Current password"
            autoComplete="current-password"
            value={current}
            onChange={setCurrent}
            disabled={busy}
          />
          <PasswordField
            label="New password"
            autoComplete="new-password"
            value={next}
            onChange={setNext}
            disabled={busy}
          />
          <PasswordField
            label="Confirm new password"
            autoComplete="new-password"
            value={confirm}
            onChange={setConfirm}
            disabled={busy}
          />
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Saving…" : "Update password"}
          </button>
        </form>
      </section>
    </>
  );
}
