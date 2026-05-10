import { answerInventoryQuestion, draftRestock } from "@/lib/forecast";
import type { ProductIntelligence } from "@/types/inventory";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function tryCodex(prompt: string) {
  if (process.env.CODEX_DISABLED === "true") return null;

  const outputPath = join(tmpdir(), `stockwatch-codex-${randomUUID()}.txt`);

  try {
    await execFileAsync(
      "codex",
      [
        "exec",
        "--sandbox",
        "read-only",
        "-m",
        process.env.CODEX_MODEL || "gpt-5.2",
        "--output-last-message",
        outputPath,
        prompt
      ],
      {
        timeout: 45000,
        maxBuffer: 1024 * 1024
      }
    );
    const cleanAnswer = await readFile(outputPath, "utf8").catch(() => "");
    return cleanAnswer.trim() || null;
  } catch {
    return null;
  } finally {
    await unlink(outputPath).catch(() => undefined);
  }
}

export async function codexDraftOrders(products: ProductIntelligence[]) {
  const prompt = [
    "You are Codex embedded in Stockwatch, an eCommerce inventory ops workflow.",
    "Return three terse restock recommendations with reasoning from this JSON:",
    JSON.stringify(
      products.map(({ sku, name, stock, threshold, salesVelocityPerHour, hoursUntilZero, urgency }) => ({
        sku,
        name,
        stock,
        threshold,
        salesVelocityPerHour,
        hoursUntilZero,
        urgency
      }))
    )
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
    "You are Codex running inside Stockwatch, an eCommerce inventory ops workflow.",
    "Answer this ops inventory question from MongoDB-like product JSON in one sentence.",
    "Do not modify files. Do not include markdown. Return only the answer sentence.",
    `Question: ${question}`,
    JSON.stringify(products)
  ].join("\n");

  const answer = await tryCodex(prompt);
  if (answer) {
    return {
      answer,
      source: "codex" as const
    };
  }

  return {
    answer: answerInventoryQuestion(question, products),
    source: "fallback" as const
  };
}
