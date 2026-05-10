"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BellRing, Bot, Clock3, Database, MessageSquare, RefreshCw, Send, Sparkles } from "lucide-react";
import type { DashboardPayload, ProductIntelligence, RestockDraft } from "@/types/inventory";

type Props = {
  initialData: DashboardPayload;
  userName: string;
};

type SlackAlertState = {
  message?: string;
  source?: "codex" | "fallback";
  error?: string;
  loading?: boolean;
};

function formatCountdown(hours: number) {
  if (!Number.isFinite(hours)) return "Stable";
  const totalSeconds = Math.max(0, Math.floor(hours * 3600));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function urgencyClass(product: ProductIntelligence) {
  if (product.status === "critical") return "urgent";
  if (product.status === "watch") return "warning";
  return "good";
}

export default function Dashboard({ initialData, userName }: Props) {
  const [data, setData] = useState(initialData);
  const [tick, setTick] = useState(0);
  const [question, setQuestion] = useState("which products will stock out before Friday?");
  const [answer, setAnswer] = useState("");
  const [answerSource, setAnswerSource] = useState<"codex" | "fallback" | "">("");
  const [queryError, setQueryError] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [scenario, setScenario] = useState("");
  const [scenarioSummary, setScenarioSummary] = useState("");
  const [scenarioSource, setScenarioSource] = useState<"codex" | "fallback" | "">("");
  const [scenarioError, setScenarioError] = useState("");
  const [isModellingScenario, setIsModellingScenario] = useState(false);
  const [slackAlerts, setSlackAlerts] = useState<Record<string, SlackAlertState>>({});
  const [rewriting, setRewriting] = useState(false);

  const critical = useMemo(() => data.products.filter((product) => product.status !== "healthy").slice(0, 3), [data]);
  const atRiskRevenue = data.products
    .filter((product) => product.status !== "healthy")
    .reduce((sum, product) => sum + product.unitCost * product.stock, 0);

  async function refresh() {
    const response = await fetch("/api/inventory", { cache: "no-store" });
    setData(await response.json());
  }

  async function seed() {
    const response = await fetch("/api/inventory/seed", { method: "POST" });
    setAnswer("");
    setAnswerSource("");
    setQueryError("");
    setScenarioSummary("");
    setScenarioSource("");
    setScenarioError("");
    setSlackAlerts({});
    setRewriting(false);
    setData(await response.json());
  }

  async function runScenario(event: React.FormEvent) {
    event.preventDefault();
    setRewriting(true);
    setIsModellingScenario(true);
    setScenarioError("");
    setScenarioSummary("");
    setScenarioSource("");

    try {
      const response = await fetch("/api/inventory/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario, products: data.products })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Scenario modelling failed.");
      setData(payload.dashboard);
      setScenarioSummary(payload.summary);
      setScenarioSource(payload.source);
      setSlackAlerts({});
    } catch (error) {
      setScenarioError(error instanceof Error ? error.message : "Scenario modelling failed.");
      setRewriting(false);
    } finally {
      setIsModellingScenario(false);
      setTimeout(() => setRewriting(false), 5000);
    }
  }

  async function askCodex(event: React.FormEvent) {
    event.preventDefault();
    setIsAsking(true);
    setQueryError("");
    setAnswer("");
    setAnswerSource("");

    try {
      const response = await fetch("/api/inventory/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Codex query failed.");
      }
      setAnswer(payload.answer);
      setAnswerSource(payload.source);
    } catch (error) {
      setQueryError(error instanceof Error ? error.message : "Codex query failed.");
    } finally {
      setIsAsking(false);
    }
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  async function draftSlackAlert(draft: RestockDraft) {
    const product = data.products.find((item) => item.sku === draft.sku);
    if (!product) return;

    setSlackAlerts((current) => ({
      ...current,
      [draft.id]: { loading: true }
    }));

    try {
      const response = await fetch("/api/inventory/slack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, draft })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Slack draft failed.");

      setSlackAlerts((current) => ({
        ...current,
        [draft.id]: { message: payload.message, source: payload.source }
      }));
    } catch (error) {
      setSlackAlerts((current) => ({
        ...current,
        [draft.id]: { error: error instanceof Error ? error.message : "Slack draft failed." }
      }));
    }
  }

  useEffect(() => {
    const interval = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <main className="shell">
      <nav className="topbar">
        <div className="brand">
          <span className="brand-mark">S</span>
          <span>Stockwatch</span>
          <span className="status-pill">
            <Database size={13} /> {data.dataMode === "mongo" ? "MongoDB Atlas" : "Local memory"}
          </span>
        </div>
        <div className="actions">
          <button className="ghost-btn" onClick={refresh} title="Refresh inventory">
            <RefreshCw size={16} />
          </button>
          <button className="ghost-btn" onClick={seed}>
            Reset demo
          </button>
          <button className="ghost-btn" onClick={logout}>
            Sign out
          </button>
          <form className="scenario-form" onSubmit={runScenario}>
            <input
              value={scenario}
              onChange={(event) => setScenario(event.target.value)}
              placeholder="Describe a demand scenario... e.g. Diwali sale — electronics surge, 3× velocity, 60% stock drop"
              required
            />
            <button className="danger-btn" type="submit" disabled={isModellingScenario}>
              <Sparkles size={16} /> {isModellingScenario ? "Modelling" : "Run Scenario"}
            </button>
          </form>
        </div>
      </nav>

      {(isModellingScenario || scenarioSummary || scenarioError) && (
        <section className={`scenario-summary ${rewriting ? "rewrite" : ""}`}>
          {scenarioSource ? (
            <span className={`status-pill source-badge ${scenarioSource === "codex" ? "source-live" : "source-local"}`}>
              {scenarioSource === "codex" ? "Codex live" : "Local engine"}
            </span>
          ) : null}
          <p>{isModellingScenario ? "Codex is modelling this scenario..." : scenarioError || scenarioSummary}</p>
        </section>
      )}

      <section className="hero">
        <div>
          <p>Welcome back, {userName}. Codex is watching SKU velocity and drafting actions before stockouts land.</p>
          <h1>Inventory urgency that moves at the speed of checkout.</h1>
        </div>
        <aside className={`hero-panel ${rewriting ? "rewrite" : ""}`}>
          <div className="hero-stat">
            <span>
              <Bot size={18} /> Codex risk score
            </span>
            <strong className={data.products[0]?.urgency > 75 ? "urgent" : "warning"}>
              {data.products[0]?.urgency || 0}
            </strong>
          </div>
          <div className="hero-stat">
            <span>
              <BellRing size={18} /> Active draft orders
            </span>
            <strong>{data.drafts.length}</strong>
          </div>
          <div className="hero-stat">
            <span>
              <AlertTriangle size={18} /> At-risk inventory value
            </span>
            <strong>${Math.round(atRiskRevenue).toLocaleString()}</strong>
          </div>
          <p className="reasoning">
            {rewriting
              ? "Stockwatch remodelled the dashboard around the scenario, countdowns, supplier actions, and urgency explanations."
              : data.products[0]?.reasoning}
          </p>
        </aside>
      </section>

      <section className="critical-strip">
        {critical.map((product) => (
          <article className="sku-card" key={product.sku}>
            <div className="panel-title">
              <div className="sku-name">
                <strong>{product.name}</strong>
                <span>{product.sku}</span>
              </div>
              <Clock3 className={urgencyClass(product)} size={22} />
            </div>
            <div className={`clock ${urgencyClass(product)}`}>
              {formatCountdown(product.hoursUntilZero - tick / 3600)}
            </div>
            <p className="reasoning">{product.reasoning}</p>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-title">
            <h2>Live SKU monitor</h2>
            <span className="status-pill">Recalculated every refresh</span>
          </div>
          <div className="sku-table">
            {data.products.map((product) => (
              <div className="sku-row" key={product.sku}>
                <div className="sku-name">
                  <strong>{product.name}</strong>
                  <span>
                    {product.category} · {product.sku}
                  </span>
                </div>
                <div>
                  <div className="metric-label">On hand</div>
                  <strong>{product.stock.toLocaleString()} units</strong>
                </div>
                <div>
                  <div className="metric-label">Threshold pressure</div>
                  <div className="progress">
                    <div
                      style={{
                        width: `${Math.min(100, (product.stock / Math.max(product.threshold, 1)) * 100)}%`,
                        background:
                          product.status === "critical"
                            ? "var(--red)"
                            : product.status === "watch"
                              ? "var(--amber)"
                              : "var(--mint)"
                      }}
                    />
                  </div>
                </div>
                <div className={urgencyClass(product)}>
                  <div className="metric-label">Urgency</div>
                  <strong>{product.urgency}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">
            <h2>Codex reasoning</h2>
            <Sparkles size={18} className="good" />
          </div>
          {data.products.slice(0, 5).map((product) => (
            <p className="reasoning" key={product.sku}>
              {product.reasoning}
            </p>
          ))}
        </div>
      </section>

      <section className="query">
        <h2>Ask inventory in plain English</h2>
        <form onSubmit={askCodex}>
          <input value={question} onChange={(event) => setQuestion(event.target.value)} />
          <button className="primary-btn" type="submit" disabled={isAsking}>
            <Send size={16} /> {isAsking ? "Asking Codex" : "Ask Codex"}
          </button>
        </form>
        {queryError ? <div className="answer error-answer">{queryError}</div> : null}
        {answer ? (
          <div className="answer">
            <span className={`status-pill source-badge ${answerSource === "codex" ? "source-live" : "source-local"}`}>
              {answerSource === "codex" ? "Codex live" : "Local engine"}
            </span>
            <p>{answer}</p>
          </div>
        ) : null}
      </section>

      <section className="drafts">
        <h2>Auto-drafted supplier actions</h2>
        <div className="draft-list">
          {data.drafts.length ? (
            data.drafts.map((draft) => (
              <article className="draft-card" key={draft.id}>
                <span className="status-pill">Urgency {draft.urgency}</span>
                <strong>{draft.productName}</strong>
                <div>{draft.message}</div>
                <p className="reasoning">{draft.reasoning}</p>
                <button
                  className="ghost-btn"
                  onClick={() => draftSlackAlert(draft)}
                  disabled={slackAlerts[draft.id]?.loading}
                >
                  <MessageSquare size={16} /> {slackAlerts[draft.id]?.loading ? "Drafting" : "Draft Slack alert"}
                </button>
                {slackAlerts[draft.id]?.error ? (
                  <div className="slack-error">{slackAlerts[draft.id]?.error}</div>
                ) : null}
                {slackAlerts[draft.id]?.message ? (
                  <div className="slack-bubble">
                    <div className="slack-meta">
                      <span className="slack-app">Stockwatch Bot</span>
                      <span
                        className={`status-pill source-badge ${
                          slackAlerts[draft.id]?.source === "codex" ? "source-live" : "source-local"
                        }`}
                      >
                        {slackAlerts[draft.id]?.source === "codex" ? "Codex live" : "Local engine"}
                      </span>
                    </div>
                    <pre>{slackAlerts[draft.id]?.message}</pre>
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <article className="draft-card">
              <strong>No drafts yet</strong>
              <p className="reasoning">
                Run a demand scenario to make Codex draft restock orders and Slack-style alert text.
              </p>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}
