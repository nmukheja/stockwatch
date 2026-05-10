import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiSession } from "@/lib/auth";
import { tryCodex } from "@/lib/codex-agent";
import { applyScenarioModel, getDashboard, simulateDemandShock } from "@/lib/store";
import type { ProductIntelligence, ScenarioModel } from "@/types/inventory";

const ProductSchema = z
  .object({
    id: z.string(),
    sku: z.string(),
    name: z.string(),
    category: z.string(),
    stock: z.number(),
    threshold: z.number(),
    reorderQuantity: z.number(),
    unitCost: z.number(),
    salesVelocityPerHour: z.number(),
    lastFourDayDropPct: z.number(),
    supplier: z.string(),
    updatedAt: z.string(),
    hoursUntilZero: z.number(),
    status: z.enum(["healthy", "watch", "critical"]),
    urgency: z.number(),
    reasoning: z.string()
  })
  .strict();

const RequestSchema = z.object({
  scenario: z.string().min(3).max(500),
  products: z.array(ProductSchema).min(1)
});

const ScenarioModelSchema = z.object({
  affectedSkus: z.array(z.string()).min(1),
  stockMultiplier: z.number().positive(),
  velocityMultiplier: z.number().positive(),
  summary: z.string().min(8).max(280)
});

function parseCodexJson(response: string | null): ScenarioModel | null {
  if (!response) return null;

  const trimmed = response.trim();
  const jsonText = trimmed.startsWith("{") ? trimmed : trimmed.match(/\{[\s\S]*\}/)?.[0];
  if (!jsonText) return null;

  try {
    return ScenarioModelSchema.parse(JSON.parse(jsonText));
  } catch {
    return null;
  }
}

function buildScenarioPrompt(scenario: string, products: ProductIntelligence[]) {
  return `You are embedded in Stockwatch, an eCommerce inventory ops system.
Given this demand scenario: ${scenario}
And this current inventory: ${JSON.stringify(products)}
Return JSON only — no markdown, no explanation outside the JSON:
{
  "affectedSkus": string[],
  "stockMultiplier": number,
  "velocityMultiplier": number,
  "summary": string
}
Choose which SKUs are realistically affected by the scenario.
stockMultiplier < 1 means stock drops (e.g. 0.4 = 60% drop).
velocityMultiplier > 1 means faster selling (e.g. 3 = 3x velocity).
summary is one sentence Codex says about what it modelled.`;
}

export async function POST(request: Request) {
  if (!getApiSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = RequestSchema.parse(await request.json());
  const prompt = buildScenarioPrompt(body.scenario, body.products);
  const model = parseCodexJson(await tryCodex(prompt));

  if (!model) {
    await simulateDemandShock();
    return NextResponse.json({
      dashboard: await getDashboard(),
      summary: "Local engine modelled a default high-demand shock across the most at-risk SKUs.",
      source: "fallback" as const
    });
  }

  await applyScenarioModel(model);
  return NextResponse.json({
    dashboard: await getDashboard(),
    summary: model.summary,
    source: "codex" as const
  });
}
