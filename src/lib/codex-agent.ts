import { answerInventoryQuestion, draftRestock } from "@/lib/forecast";
import type { ProductIntelligence } from "@/types/inventory";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function tryCodex(prompt: string) {
  if (process.env.CODEX_SDK_ENABLED !== "true") return null;

  try {
    const { stdout } = await execFileAsync("codex", ["exec", "--ask-for-approval", "never", prompt], {
      timeout: 30000,
      maxBuffer: 1024 * 1024
    });
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

export async function codexDraftOrders(products: ProductIntelligence[]) {
  const prompt = [
    "You are Codex embedded in Stockwatch, an eCommerce inventory ops workflow.",
    "Return three terse restock recommendations with reasoning from this JSON:",
    JSON.stringify(products.map(({ sku, name, stock, threshold, salesVelocityPerHour, hoursUntilZero, urgency }) => ({ sku, name, stock, threshold, salesVelocityPerHour, hoursUntilZero, urgency })))
  ].join("\n");

  const codexText = await tryCodex(prompt);
  if (codexText) return codexText;

  return products
    .map(draftRestock)
    .filter(Boolean)
    .map((draft) => `${draft?.message} ${draft?.reasoning}`)
    .join("\n");
}

export async function codexAnswerInventoryQuestion(question: string, products: ProductIntelligence[]) {
  const prompt = [
    "Answer this ops inventory question from MongoDB-like product JSON in one sentence.",
    `Question: ${question}`,
    JSON.stringify(products)
  ].join("\n");

  return (await tryCodex(prompt)) || answerInventoryQuestion(question, products);
}
