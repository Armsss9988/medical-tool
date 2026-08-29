# GoLab Medical Tool

Medical test results & laboratory management web application built with React, Vite, Supabase Cloud DB, and Clean DDD Architecture.

## Features
- Medical Test Catalog Management (130+ indicators & 91 PROTIA IgE allergens)
- Test Packages & Medical Groups
- Patient & Test Result Evaluation
- Invoices & Revenue Management
- 1-Click Sharp A4 PDF Export & Cloud Backup
- QR Code Generation
- Local-First + Supabase Cloud DB Auto Sync

## Development
```bash
npm run dev:vite
```

## Build
```bash
npm run build
```

## Deployment (Vercel)

Cách deploy khuyên dùng: **một Vercel project** cho toàn bộ repo. Web (tĩnh) và
API (Hono serverless function) cùng một project, cùng domain, `/api/*` same-origin
— không cần rewrite hay placeholder.

1. Tạo **một** Vercel project, Root Directory = repo root (`.`). Vercel đọc
   `vercel.json` ở root: build web (`npm run build` → `apps/web/dist`), và dùng
   `api/index.ts` làm serverless function Node (runtime `nodejs20.x`) phục vụ
   `/api/*`.
2. Set env vars trên project: `DATABASE_URL` (Supavisor port **6543**),
   `APP_ACCESS_PASSWORD`.
3. **Migrations** — chạy 1 lần (local, trỏ vào Supabase) để tạo bảng:
   ```bash
   npm run -w @golab/api drizzle:migrate
   ```
4. **Password gate** — app hiển thị modal nhập `APP_ACCESS_PASSWORD` lần đầu mở
   (header `x-app-password`). Nếu `APP_ACCESS_PASSWORD` chưa set trên Vercel, mọi
   route `/api/*` trả **503**.
5. **API base url** — mặc định web gọi `/api` (same-origin). Để test local với API
   chạy riêng, set `VITE_API_BASE_URL` = URL API (xem `.env.example`).

> Lưu ý: file function là `api/index.ts` (root), import Hono app từ
> `apps/api/src/index.ts`. Đừng xoá `api/` — đó là entry serverless.

### Alternative (two projects)
Có thể tách riêng API thành project thứ hai và để web rewrite `/api/*` sang domain
kia, nhưng cách một project ở trên đơn giản hơn và là mặc định.

