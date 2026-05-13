import mongoose from "mongoose";

const UNITS = ["kg", "meter", "Pcs", "Bundle"];

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    size: { type: String, required: true, trim: true },
    unit: { type: String, required: true, enum: UNITS },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true }
);

export const PRODUCT_UNITS = UNITS;
export default mongoose.model("Product", productSchema);
