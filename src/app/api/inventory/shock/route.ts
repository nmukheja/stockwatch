import { NextResponse } from "next/server";
import { getDashboard, simulateDemandShock } from "@/lib/store";

export async function POST() {
  await simulateDemandShock();
  return NextResponse.json(await getDashboard());
}
