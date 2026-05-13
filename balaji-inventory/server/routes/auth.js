import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import AdminCredential from "../models/AdminCredential.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const SALT_ROUNDS = 10;

/** Public: whether admin password lives in Mongo (after Change password). */
router.get("/login-hint", async (_req, res) => {
  try {
    const doc = await AdminCredential.findOne();
    res.json({ hasStoredPassword: Boolean(doc?.passwordHash) });
  } catch {
    res.json({ hasStoredPassword: false, unavailable: true });
  }
});

async function passwordIsValid(plain) {
  const doc = await AdminCredential.findOne();
  if (doc?.passwordHash) {
    return bcrypt.compare(plain, doc.passwordHash);
  }
  const envPass = process.env.ADMIN_PASSWORD;
  if (envPass) return plain === envPass;
  return false;
}

router.post("/login", async (req, res) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "Server missing JWT_SECRET" });
  }
  const password = req.body?.password ?? "";
  if (!password || typeof password !== "string") {
    return res.status(400).json({ error: "Password required" });
  }
  const ok = await passwordIsValid(password);
  if (!ok) {
    return res.status(401).json({ error: "Invalid password" });
  }
  const token = jwt.sign({ sub: "admin" }, secret, { expiresIn: "7d" });
  res.json({ token });
});

router.post("/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current and new password required" });
  }
  if (typeof newPassword !== "string" || newPassword.length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters" });
  }
  const ok = await passwordIsValid(currentPassword);
  if (!ok) {
    return res.status(401).json({ error: "Current password is wrong" });
  }
  const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await AdminCredential.findOneAndUpdate(
    {},
    { passwordHash: hash },
    { upsert: true, new: true }
  );
  res.json({ ok: true });
});

export default router;
