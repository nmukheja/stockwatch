import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiSession } from "@/lib/auth";
import { tryCodex } from "@/lib/codex-agent";

const ProductSchema = z.object({
  sku: z.string(),
  name: z.string(),
  category: z.string(),
  stock: z.number(),
  threshold: z.number(),
  reorderQuantity: z.number(),
  supplier: z.string(),
  salesVelocityPerHour: z.number(),
  hoursUntilZero: z.number(),
  urgency: z.number(),
  reasoning: z.string()
});

const DraftSchema = z.object({
  sku: z.string(),
  productName: z.string(),
  quantity: z.number(),
  supplier: z.string(),
  urgency: z.number(),
  message: z.string(),
  reasoning: z.string()
});

const RequestSchema = z.object({
  product: ProductSchema,
  draft: DraftSchema
});

function fallbackSlackMessage(product: z.infer<typeof ProductSchema>, draft: z.infer<typeof DraftSchema>) {
  return [
    ":rotating_light: *Urgent stockout risk*",
    `*${product.name}* (${product.sku}) is projected to stock out in ${Math.round(product.hoursUntilZero)}h.`,
    `Recommended action: order *${draft.quantity.toLocaleString()} units* from ${draft.supplier}.`,
    `_Reason: ${draft.reasoning}_`
  ].join("\n");
}

export async function POST(request: Request) {
  if (!getApiSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = RequestSchema.parse(await request.json());
  const prompt = [
    "You are embedded in Stockwatch, an eCommerce inventory ops workflow.",
    "Write one urgent Slack-formatted message for the ops channel.",
    "Use Slack markdown, include an urgency emoji, keep it under 80 words, and include the recommended restock action.",
    "Return only the Slack message text. No markdown fences, no preamble.",
    `Product data: ${JSON.stringify(body.product)}`,
    `Restock draft: ${JSON.stringify(body.draft)}`
  ].join("\n");

  const message = await tryCodex(prompt);
  if (message) {
    return NextResponse.json({ message, source: "codex" as const });
  }

  return NextResponse.json({
    message: fallbackSlackMessage(body.product, body.draft),
    source: "fallback" as const
  });
}
