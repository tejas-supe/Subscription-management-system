# Brightloop

Brightloop is scaffolded as a React + TypeScript frontend and an Express + TypeScript backend, with shared TypeScript contracts.

## Development

Install workspace dependencies from the repository root with `npm install`. Copy the relevant `.env.example` files to `.env` before running the apps.

- `npm run dev:frontend` — Vite frontend at `http://localhost:5173`
- `npm run dev:backend` — API at `http://localhost:3000`; health check at `/api/health`
- `npm run build` — build both applications

The `brightloop_core/` directory is the earlier Odoo addon. It is intentionally retained and is not part of this React/Node scaffold.
