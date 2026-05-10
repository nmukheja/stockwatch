import { NextResponse } from "next/server";
import { z } from "zod";
import { createToken, createUser, setSessionCookie } from "@/lib/auth";

const RegisterSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

export async function POST(request: Request) {
  try {
    const body = RegisterSchema.parse(await request.json());
    const user = await createUser(body);
    setSessionCookie(createToken(user));
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create account";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
