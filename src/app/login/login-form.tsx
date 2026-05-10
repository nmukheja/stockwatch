"use client";

import { useState } from "react";

export default function LoginForm() {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const result = await fetch(mode === "register" ? "/api/register" : "/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password")
      })
    });

    if (result.ok) window.location.href = "/";
    else {
      const payload = await result.json().catch(() => null);
      setError(payload?.error || "Unable to continue.");
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="segmented" aria-label="Authentication mode">
        <button className={mode === "register" ? "active" : ""} type="button" onClick={() => setMode("register")}>
          Register
        </button>
        <button className={mode === "login" ? "active" : ""} type="button" onClick={() => setMode("login")}>
          Sign in
        </button>
      </div>
      {mode === "register" ? (
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" type="text" autoComplete="name" placeholder="Ops Lead" required />
        </div>
      ) : null}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          minLength={mode === "register" ? 8 : 1}
          required
        />
      </div>
      {error ? <p className="urgent">{error}</p> : null}
      <button className="primary-btn" style={{ width: "100%", marginTop: 18 }} type="submit">
        {mode === "register" ? "Create account" : "Enter dashboard"}
      </button>
    </form>
  );
}
