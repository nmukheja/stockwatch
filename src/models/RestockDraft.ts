import mongoose, { Schema } from "mongoose";

const RestockDraftSchema = new Schema(
  {
    sku: { type: String, required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    supplier: { type: String, required: true },
    urgency: { type: Number, required: true },
    message: { type: String, required: true },
    reasoning: { type: String, required: true }
  },
  { timestamps: true }
);

export const RestockDraftModel =
  mongoose.models.RestockDraft || mongoose.model("RestockDraft", RestockDraftSchema);
