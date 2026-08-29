# GoLab API

Hono + Drizzle on Node, serverless-ready (Vercel).

## Env (đặt trong root .env)

- `DATABASE_URL` — Connection string **Transaction mode** (Supavisor, port 6543)
  lấy từ Supabase: Project Settings → Database → Connection string → Transaction.
  PHẢI dùng port 6543 (transaction), KHÔNG dùng 5432 (session) trên serverless.
- `APP_ACCESS_PASSWORD` — mật khẩu gate (header `x-app-password`).

## Migrations

```bash
npm run -w @golab/api drizzle:generate   # sinh SQL migration từ schema
npm run -w @golab/api drizzle:migrate    # apply (cần DATABASE_URL)
```

## Dev

```bash
npm run -w @golab/api dev   # tsx src/index.ts (local Hono serve)
```

## OpenAPI

`GET /api/openapi.json` — trả về OpenAPI 3.0.3 spec (không bị gate, public).

## Deploy (Vercel)

- Tạo project mới, Root Directory = `apps/api`, framework Node.js.
- Config: `apps/api/vercel.json` (build `npm run build -w @golab/api`, entry
  `src/index.ts` default export `app`).
- Env vars: `DATABASE_URL`, `APP_ACCESS_PASSWORD`.
- Apply migrations sau deploy: `npm run -w @golab/api drizzle:migrate`.

### Runtime caveat (CẦN XÁC NHẬN TRÊN VERCEL)
`src/index.ts` làm `export default app` (Hono instance). Hai hướng:

1. **Node runtime** (mặc định trong `vercel.json` — `runtime: nodejs20.x`):
   `@vercel/node` có thể không tự wrap default export Hono. Nếu deploy báo lỗi
   handler, thêm file `apps/api/api/index.ts`:
   ```ts
   import app from '../src/index';
   export default app;
   ```
   và cập nhật `functions` trong `vercel.json` thành `{ "api/index.ts": {...} }`.
2. **Edge runtime**: đổi `"runtime": "edge"` trong `functions` (Hono hỗ trợ Edge
   native). Nếu dùng Edge, `DATABASE_URL` Supavisor vẫn ok nhưng cần chú ý
   driver `postgres` tương thích Edge.

> Deploy CHƯA được test ở đây — hãy confirm trong dashboard Vercel runtime nào
> chạy được và điều chỉnh `vercel.json` tương ứng.
