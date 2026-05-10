import { describe, expect, it } from "vitest";
import { answerInventoryQuestion, calculateUrgency, enrichProduct, estimateHoursUntilZero } from "@/lib/forecast";
import { seedProducts } from "@/lib/seed";

describe("inventory forecasting", () => {
  it("estimates stockout countdown from stock and velocity", () => {
    expect(estimateHoursUntilZero(120, 5)).toBe(24);
    expect(estimateHoursUntilZero(120, 0)).toBe(Number.POSITIVE_INFINITY);
  });

  it("scores fast dropping low-stock products as urgent", () => {
    const product = { ...seedProducts[0], stock: 40, threshold: 120, salesVelocityPerHour: 8, lastFourDayDropPct: 91 };
    expect(calculateUrgency(product)).toBeGreaterThanOrEqual(80);
  });

  it("answers before-Friday questions from enriched product data", () => {
    const products = seedProducts.map(enrichProduct);
    const answer = answerInventoryQuestion("which products will stock out before Friday?", products, new Date("2026-05-11T10:00:00Z"));
    expect(answer).toContain("before Friday");
    expect(answer).toContain("APN-2049");
  });
});
