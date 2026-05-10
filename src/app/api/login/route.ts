import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateUser, createToken, setSessionCookie } from "@/lib/auth";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(request: Request) {
  const body = LoginSchema.parse(await request.json());
  const user = await authenticateUser(body.email, body.password);
  if (!user) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  setSessionCookie(createToken(user));
  return NextResponse.json({ user });
}
