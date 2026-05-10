import { NextResponse } from "next/server";
import { getDashboard, seedInventory } from "@/lib/store";

export async function POST() {
  await seedInventory();
  return NextResponse.json(await getDashboard());
}
