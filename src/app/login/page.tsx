import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const session = getSession();
  if (session) redirect("/");

  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="brand">
          <span className="brand-mark">S</span>
          <span>Stockwatch</span>
        </div>
        <h1 style={{ marginTop: 24 }}>Ops command center</h1>
        <p>
          Register your ops account or sign in to watch Codex forecast stockouts, explain urgency, and draft supplier
          actions.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
