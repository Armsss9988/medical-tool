# GoLab API

## Env (đặt trong root .env)

DATABASE_URL — Connection string **Transaction mode** (Supavisor, port 6543)
  lấy từ Supabase: Project Settings → Database → Connection string → Transaction.
APP_ACCESS_PASSWORD — mật khẩu gate (header `x-app-password`).

## Migrations

npx drizzle-kit generate   # sinh SQL migration từ schema
npx drizzle-kit migrate    # apply (cần DATABASE_URL + `npm run -w @golab/api drizzle:migrate`)

## Dev

npm run dev -w @golab/api   # tsx src/index.ts (chạy local qua Hono serve)

## Deploy (Vercel)

- Tạo project mới, root directory = `apps/api`, framework Node.js.
- Env vars: DATABASE_URL, APP_ACCESS_PASSWORD.
- Entry `src/index.ts` (default export) — Vercel tự build TS.
