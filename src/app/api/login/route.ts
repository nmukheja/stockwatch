import { NextResponse } from "next/server";
import { z } from "zod";
import { demoCredentials, sessionCookieName } from "@/lib/session";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(request: Request) {
  const body = LoginSchema.parse(await request.json());
  const credentials = demoCredentials();

  if (body.email !== credentials.email || body.password !== credentials.password) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, "ops-lead", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
  return response;
}
