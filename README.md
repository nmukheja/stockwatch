# Stockwatch

Smart inventory alerting for eCommerce ops teams. Stockwatch gives a live dashboard for critical SKUs, stockout countdown clocks, Codex-generated urgency explanations, auto-drafted restock actions, and one-sentence natural-language inventory questions.

## Demo flow

1. Register an ops account or sign in with an existing account.
2. Review the live SKU monitor and countdown clocks.
3. Click **Trigger demand spike** to simulate a fast checkout surge.
4. Watch the dashboard highlight critical countdowns and generate draft supplier actions.
5. Ask: `which products will stock out before Friday?`

## Stack

- Next.js App Router and React
- Register/sign-in auth with MongoDB user persistence, password hashing, and signed JWT session cookies
- MongoDB Atlas persistence through Mongoose
- Programmatic `codex exec` bridge with deterministic local fallback
- Vitest unit tests for stockout forecasting and natural-language query behavior

## Environment

Copy `.env.example` to `.env.local` and set `MONGODB_URI` plus `AUTH_SECRET`. User registration and login require MongoDB because user accounts are persisted in Atlas. Inventory data still falls back to local memory if no URI is present, which is useful while developing non-auth flows.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Codex integration

`src/lib/codex-agent.ts` is the programmatic Codex boundary. Set `CODEX_SDK_ENABLED=true` on a machine with the Codex CLI installed and authenticated to let the app call `codex exec` for restock reasoning and inventory answers. Without that flag, Stockwatch uses the same deterministic forecasting engine used by tests, which keeps the demo reliable.

## Tests

```bash
npm test
```
