import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { connectMongo } from "@/lib/mongodb";
import { UserModel } from "@/models/User";

export const sessionCookieName = "stockwatch_session";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type JwtPayload = AuthUser & {
  exp: number;
};

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is required for JWT sessions. Set it in .env.local.");
  }
  return secret;
}

function sign(data: string) {
  return createHmac("sha256", getAuthSecret()).update(data).digest("base64url");
}

export function createToken(user: AuthUser) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      ...user,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8
    } satisfies JwtPayload)
  );
  const unsigned = `${header}.${payload}`;
  return `${unsigned}.${sign(unsigned)}`;
}

export function verifyToken(token: string): AuthUser | null {
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) return null;

  const expected = sign(`${header}.${payload}`);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;

  let decoded: JwtPayload;
  try {
    decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as JwtPayload;
  } catch {
    return null;
  }

  if (!decoded.id || !decoded.email || !decoded.name || !decoded.role || decoded.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return {
    id: decoded.id,
    name: decoded.name,
    email: decoded.email,
    role: decoded.role
  };
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;

  const hashedInput = Buffer.from(scryptSync(password, salt, 64).toString("hex"));
  const stored = Buffer.from(hash);
  return hashedInput.length === stored.length && timingSafeEqual(hashedInput, stored);
}

export function setSessionCookie(token: string) {
  cookies().set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
}

export function clearSessionCookie() {
  cookies().delete(sessionCookieName);
}

export function getSession() {
  const token = cookies().get(sessionCookieName)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function requireSession() {
  const user = getSession();
  if (!user) redirect("/login");
  return user;
}

export function getApiSession() {
  return getSession();
}

export async function createUser(input: { name: string; email: string; password: string }) {
  const mongo = await connectMongo();
  if (!mongo) {
    throw new Error("MongoDB is required for user registration. Set MONGODB_URI in .env.local.");
  }

  const email = input.email.toLowerCase().trim();
  const existing = await UserModel.findOne({ email }).lean();
  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const user = await UserModel.create({
    name: input.name.trim(),
    email,
    passwordHash: hashPassword(input.password),
    role: "ops"
  });

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role
  } satisfies AuthUser;
}

export async function authenticateUser(email: string, password: string) {
  const mongo = await connectMongo();
  if (!mongo) {
    throw new Error("MongoDB is required for login. Set MONGODB_URI in .env.local.");
  }

  const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
  if (!user || !verifyPassword(password, user.passwordHash)) return null;

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role
  } satisfies AuthUser;
}
