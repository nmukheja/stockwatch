import { NextResponse } from "next/server";
import { getApiSession } from "@/lib/auth";
import { getDashboard } from "@/lib/store";

export async function GET() {
  if (!getApiSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getDashboard());
}
