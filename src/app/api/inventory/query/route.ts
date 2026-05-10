import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiSession } from "@/lib/auth";
import { codexAnswerInventoryQuestion } from "@/lib/codex-agent";
import { getDashboard } from "@/lib/store";

const QuerySchema = z.object({
  question: z.string().min(3).max(240)
});

export async function POST(request: Request) {
  if (!getApiSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = QuerySchema.parse(await request.json());
  const dashboard = await getDashboard();
  const answer = await codexAnswerInventoryQuestion(body.question, dashboard.products);
  return NextResponse.json({ answer });
}
