import { NextResponse } from "next/server";
import { getApiSession } from "@/lib/auth";
import { getDashboard, simulateDemandShock } from "@/lib/store";

export async function POST() {
  if (!getApiSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await simulateDemandShock();
  return NextResponse.json(await getDashboard());
}
