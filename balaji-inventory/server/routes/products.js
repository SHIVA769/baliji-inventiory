import { Router } from "express";
import Product from "../models/Product.js";
import StockTransaction from "../models/StockTransaction.js";

const router = Router();

async function logTx(doc) {
  await StockTransaction.create(doc);
}

router.get("/", async (_req, res) => {
  const list = await Product.find().sort({ updatedAt: -1 }).lean();
  res.json(list);
});

router.post("/", async (req, res) => {
  try {
    const { name, size, unit, quantity, lowStockThreshold } = req.body;
    const p = await Product.create({
      name,
      size,
      unit,
      quantity: Number(quantity) || 0,
      lowStockThreshold: Number(lowStockThreshold) || 0,
    });
    await logTx({
      productId: p._id,
      productName: p.name,
      type: "create",
      quantityAfter: p.quantity,
      note: "Product added",
    });
    res.status(201).json(p);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { name, size, unit, quantity, lowStockThreshold } = req.body;
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ error: "Not found" });
    if (name != null) p.name = name;
    if (size != null) p.size = size;
    if (unit != null) p.unit = unit;
    if (quantity != null) p.quantity = Math.max(0, Number(quantity));
    if (lowStockThreshold != null) p.lowStockThreshold = Math.max(0, Number(lowStockThreshold));
    await p.save();
    await logTx({
      productId: p._id,
      productName: p.name,
      type: "update",
      quantityAfter: p.quantity,
      note: "Product edited",
    });
    res.json(p);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post("/:id/adjust", async (req, res) => {
  try {
    const delta = Number(req.body.delta);
    if (!Number.isFinite(delta) || delta === 0) {
      return res.status(400).json({ error: "delta must be a non-zero number" });
    }
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ error: "Not found" });
    const next = Math.max(0, p.quantity + delta);
    p.quantity = next;
    await p.save();
    await logTx({
      productId: p._id,
      productName: p.name,
      type: delta > 0 ? "add_qty" : "reduce_qty",
      delta,
      quantityAfter: p.quantity,
    });
    res.json(p);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete("/:id", async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ error: "Not found" });
  await logTx({
    productId: p._id,
    productName: p.name,
    type: "delete",
    quantityAfter: 0,
    note: "Product removed",
  });
  await p.deleteOne();
  res.json({ ok: true });
});

export default router;
