import { NextResponse } from "next/server";
import { getDashboard } from "@/lib/store";

export async function GET() {
  return NextResponse.json(await getDashboard());
}
