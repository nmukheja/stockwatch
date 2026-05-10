import type { InventoryStatus, Product, ProductIntelligence, RestockDraft } from "@/types/inventory";

export function estimateHoursUntilZero(stock: number, salesVelocityPerHour: number) {
  if (stock <= 0) return 0;
  if (salesVelocityPerHour <= 0) return Number.POSITIVE_INFINITY;
  return stock / salesVelocityPerHour;
}

export function classifyProduct(product: Product): InventoryStatus {
  const hours = estimateHoursUntilZero(product.stock, product.salesVelocityPerHour);
  if (product.stock <= product.threshold || hours <= 36) return "critical";
  if (product.stock <= product.threshold * 1.75 || hours <= 96) return "watch";
  return "healthy";
}

export function calculateUrgency(product: Product) {
  const hours = estimateHoursUntilZero(product.stock, product.salesVelocityPerHour);
  const thresholdPressure = Math.min(45, Math.max(0, (product.threshold / Math.max(product.stock, 1)) * 26));
  const velocityPressure = Math.min(35, Math.max(0, (96 - Math.min(hours, 96)) / 96) * 35);
  const dropPressure = Math.min(20, Math.max(0, product.lastFourDayDropPct / 100) * 20);
  return Math.round(Math.min(99, thresholdPressure + velocityPressure + dropPressure));
}

export function explainUrgency(product: Product, urgency = calculateUrgency(product)) {
  const hours = estimateHoursUntilZero(product.stock, product.salesVelocityPerHour);
  const hoursText = Number.isFinite(hours)
    ? `${Math.max(0, Math.round(hours))} hours until stockout`
    : "no current sell-through";
  return `I flagged ${product.sku} as urgency ${urgency} because stock dropped ${product.lastFourDayDropPct}% in 4 days, velocity is ${product.salesVelocityPerHour.toFixed(1)} units/hour, and there are ${hoursText}.`;
}

export function enrichProduct(product: Product): ProductIntelligence {
  const urgency = calculateUrgency(product);
  return {
    ...product,
    hoursUntilZero: estimateHoursUntilZero(product.stock, product.salesVelocityPerHour),
    status: classifyProduct(product),
    urgency,
    reasoning: explainUrgency(product, urgency)
  };
}

export function draftRestock(product: ProductIntelligence): RestockDraft | null {
  if (product.status !== "critical" && product.urgency < 70) return null;

  return {
    id: `${product.sku}-${Date.now()}`,
    sku: product.sku,
    productName: product.name,
    quantity: Math.max(product.reorderQuantity, Math.ceil(product.salesVelocityPerHour * 168)),
    supplier: product.supplier,
    urgency: product.urgency,
    message: `Draft PO: order ${Math.max(product.reorderQuantity, Math.ceil(product.salesVelocityPerHour * 168)).toLocaleString()} units of ${product.name} from ${product.supplier}.`,
    reasoning: product.reasoning,
    createdAt: new Date().toISOString()
  };
}

export function answerInventoryQuestion(question: string, products: ProductIntelligence[], now = new Date()) {
  const lower = question.toLowerCase();
  const friday = nextWeekday(now, 5);
  const hoursUntilFriday = Math.max(0, (friday.getTime() - now.getTime()) / 36e5);
  const beforeFriday = products.filter((product) => product.hoursUntilZero <= hoursUntilFriday);

  if (lower.includes("friday") || lower.includes("before")) {
    if (!beforeFriday.length) return "No products are projected to stock out before Friday on current velocity.";
    return `${beforeFriday.map((product) => `${product.name} (${product.sku}) in ${Math.round(product.hoursUntilZero)}h`).join(", ")} are projected to stock out before Friday.`;
  }

  if (lower.includes("critical") || lower.includes("urgent")) {
    const critical = products.filter((product) => product.status === "critical").sort((a, b) => b.urgency - a.urgency);
    if (!critical.length) return "No SKUs are critical right now.";
    return `Most urgent: ${critical.map((product) => `${product.name} (${product.urgency})`).join(", ")}.`;
  }

  const top = [...products].sort((a, b) => a.hoursUntilZero - b.hoursUntilZero).slice(0, 3);
  return `Fastest stockout risk: ${top.map((product) => `${product.name} in ${Math.round(product.hoursUntilZero)}h`).join(", ")}.`;
}

export function nextWeekday(date: Date, weekday: number) {
  const result = new Date(date);
  const daysAhead = (weekday + 7 - result.getDay()) % 7 || 7;
  result.setDate(result.getDate() + daysAhead);
  result.setHours(23, 59, 59, 999);
  return result;
}
