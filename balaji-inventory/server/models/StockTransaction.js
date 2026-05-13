import mongoose from "mongoose";

const stockTransactionSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    type: {
      type: String,
      enum: ["create", "update", "delete", "add_qty", "reduce_qty"],
      required: true,
    },
    delta: { type: Number, default: 0 },
    quantityAfter: { type: Number },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("StockTransaction", stockTransactionSchema);
