import { Router } from "express";
import StockTransaction from "../models/StockTransaction.js";

const router = Router();

router.get("/", async (_req, res) => {
  const list = await StockTransaction.find().sort({ createdAt: -1 }).limit(200).lean();
  res.json(list);
});

export default router;
