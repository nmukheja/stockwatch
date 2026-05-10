"use client";

import { useState } from "react";

export default function LoginForm() {
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const result = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password")
      })
    });

    if (result.ok) window.location.href = "/";
    else setError("Invalid demo credentials.");
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" defaultValue="ops@stockwatch.local" required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" defaultValue="codex-demo" required />
      </div>
      {error ? <p className="urgent">{error}</p> : null}
      <button className="primary-btn" style={{ width: "100%", marginTop: 18 }} type="submit">
        Enter dashboard
      </button>
    </form>
  );
}
