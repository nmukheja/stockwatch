import { cookies } from "next/headers";

export const sessionCookieName = "stockwatch_session";

export function demoCredentials() {
  return {
    email: process.env.OPS_DEMO_EMAIL || "ops@stockwatch.local",
    password: process.env.OPS_DEMO_PASSWORD || "codex-demo"
  };
}

export function getDemoSession() {
  const value = cookies().get(sessionCookieName)?.value;
  if (value !== "ops-lead") return null;
  return {
    user: {
      id: "ops-lead",
      name: "Ops Lead",
      email: demoCredentials().email
    }
  };
}
