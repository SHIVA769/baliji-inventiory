import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "Server missing JWT_SECRET" });
  }
  const h = req.headers.authorization;
  const raw = h?.startsWith("Bearer ") ? h.slice(7) : null;
  if (!raw) {
    return res.status(401).json({ error: "Sign in required" });
  }
  try {
    jwt.verify(raw, secret);
    next();
  } catch {
    return res.status(401).json({ error: "Session expired. Sign in again." });
  }
}
