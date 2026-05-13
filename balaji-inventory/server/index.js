import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRouter from "./routes/auth.js";
import productsRouter from "./routes/products.js";
import transactionsRouter from "./routes/transactions.js";
import { requireAuth } from "./middleware/auth.js";

const isProd = process.env.NODE_ENV === "production";
if (!process.env.JWT_SECRET) {
  if (isProd) {
    console.error("FATAL: Set JWT_SECRET in server/.env for production.");
    process.exit(1);
  }
  process.env.JWT_SECRET = "dev-only-balaji-jwt-secret-not-for-production";
  console.warn("[auth] JWT_SECRET not set; using insecure dev default.");
}
if (!process.env.ADMIN_PASSWORD && !isProd) {
  process.env.ADMIN_PASSWORD = "password1234";
  console.warn(
    '[auth] ADMIN_PASSWORD not set; using dev default "password1234" until you set server/.env'
  );
}

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/balaji_inventory";

app.use(cors({ origin: true }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, shop: "Balaji Enterprise", app: "Balaji Inventory" });
});

app.use("/api/auth", authRouter);
app.use("/api/products", requireAuth, productsRouter);
app.use("/api/transactions", requireAuth, transactionsRouter);

console.log("Connecting to MongoDB…");
mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
  })
  .then(() => {
    if (String(MONGODB_URI).includes("mongodb+srv")) {
      console.log("MongoDB connected (Atlas / mongodb+srv).");
    } else {
      console.log("MongoDB connected.");
    }
    app.listen(PORT, () => {
      console.log(`Balaji Inventory API http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    console.error(
      "Check MONGODB_URI in server/.env (Atlas: network IP allowlist, user/password, mongodb+srv URI)."
    );
    process.exit(1);
  });
