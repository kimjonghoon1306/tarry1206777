# Blog Automation Platform

Vite + React 19 frontend with Express server hosting Vercel-style serverless API handlers.

## Structure
- `client/` — React app (Vite root)
- `server/index.ts` — Express server: serves frontend (Vite middleware in dev, static `dist/public` in prod) and dynamically mounts each `api/*.js` file as `/api/<filename>`
- `api/` — Vercel-style request handlers (`export default async function handler(req, res)`)
- `shared/` — Shared types/constants

## Scripts
- `pnpm dev` — runs Express + Vite middleware on port 5000
- `pnpm build` — builds client to `dist/public` and bundles server to `dist/index.js`
- `pnpm start` — runs production server

## Replit notes
- Single port 5000 serves frontend and `/api/*`
- Dev workflow: `Start application` → `pnpm run dev`
- Migrated from Vercel: serverless functions are loaded by Express at boot
- Required env vars (set as Replit Secrets): `NAVER_ACCESS_LICENSE`, `NAVER_SECRET_KEY`, `NAVER_CUSTOMER_ID`, `GEMINI_API_KEY`, optional `WP_URL`, `WP_USERNAME`, `WP_APP_PASSWORD`
