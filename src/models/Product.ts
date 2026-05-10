import mongoose, { Schema } from "mongoose";

const ProductSchema = new Schema(
  {
    sku: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    stock: { type: Number, required: true },
    threshold: { type: Number, required: true },
    reorderQuantity: { type: Number, required: true },
    unitCost: { type: Number, required: true },
    salesVelocityPerHour: { type: Number, required: true },
    lastFourDayDropPct: { type: Number, required: true },
    supplier: { type: String, required: true }
  },
  { timestamps: true }
);

export const ProductModel = mongoose.models.Product || mongoose.model("Product", ProductSchema);
