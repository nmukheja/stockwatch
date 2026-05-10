# Stockwatch

Smart inventory alerting for eCommerce ops teams. Stockwatch gives a live dashboard for critical SKUs, stockout countdown clocks, Codex-generated urgency explanations, auto-drafted restock actions, and one-sentence natural-language inventory questions.

The business value is simple: ops teams can see stockout risk before customers feel it. By combining inventory thresholds, sell-through velocity, supplier drafts, and natural-language investigation in one workflow, Stockwatch helps reduce lost sales, avoid emergency procurement, prioritize high-risk SKUs, and give category managers a clear explanation for every restock decision.

## Demo flow

1. Register an ops account or sign in with an existing account.
2. Review the live SKU monitor and countdown clocks.
3. Click **Trigger demand spike** to simulate a fast checkout surge.
4. Watch the dashboard highlight critical countdowns and generate draft supplier actions.
5. Ask: `which products will stock out before Friday?`
6. Look for the green `Codex live` badge above the answer. If Codex is unavailable, the badge says `Local engine`.

## Stack

- Next.js App Router and React
- Register/sign-in auth with MongoDB user persistence, password hashing, and signed JWT session cookies
- MongoDB Atlas persistence through Mongoose
- Programmatic `codex exec` bridge for live natural-language inventory answers
- Vitest unit tests for stockout forecasting and natural-language query behavior

## Environment

Copy `.env.example` to `.env.local` and set `MONGODB_URI` plus `AUTH_SECRET`. User registration and login require MongoDB because user accounts are persisted in Atlas. Inventory data still falls back to local memory if no URI is present, which is useful while developing non-auth flows.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Codex integration

`src/lib/codex-agent.ts` is the programmatic Codex boundary. The `tryCodex` function calls `codex exec` from inside the app when `CODEX_SDK_ENABLED=true`, writes the final model response to a temporary file with `--output-last-message`, and returns that answer to the dashboard. The visible result badge says `Codex live` when the CLI path succeeds and `Local engine` when the deterministic fallback answers instead.

It defaults to `CODEX_MODEL=gpt-5.2` for compatibility with the current Codex CLI; set a different model in `.env.local` after upgrading the CLI. Set `CODEX_DISABLED=true` only when running in an environment without Codex.

Useful demo env values:

```bash
CODEX_SDK_ENABLED=true
CODEX_MODEL=gpt-5.2
CODEX_DISABLED=false
```

## Tests

```bash
npm test
```

## Video outline

1. Demo the app: register, trigger a demand spike, show stockout countdowns, restock drafts, and ask which products will stock out before Friday.
2. Show the `Codex live` badge after the natural-language answer to prove the app used the live Codex CLI path.
3. Explain the build: MongoDB user/inventory persistence, JWT auth, forecast tests, and the `src/lib/codex-agent.ts` bridge.
4. Open `tryCodex` and show how `CODEX_SDK_ENABLED=true` makes the app call `codex exec` programmatically.
