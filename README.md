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

Cách deploy khuyên dùng: **hai Vercel project** (web + api) để web gọi api cùng
origin tại `/api`.

1. **API project** — tạo project mới, Root Directory = `apps/api`, framework Node.js.
   Vercel dùng `apps/api/vercel.json` (build `npm run build -w @golab/api`, entry
   `src/index.ts` default export). Set env vars: `DATABASE_URL` (Supavisor port
   **6543**), `APP_ACCESS_PASSWORD`.
2. **Web project** — tạo project mới, Root Directory = `apps/web`, framework Vite.
   Vercel dùng `apps/web/vercel.json` để **rewrite** `/api/*` → API project URL.
   Thay `<api-project>` trong `apps/web/vercel.json` bằng domain thật của API
   project (ví dụ `golab-api.vercel.app`).
3. **Migrations** — chạy 1 lần sau deploy để tạo bảng:
   ```bash
   npm run -w @golab/api drizzle:migrate
   ```
4. **API base url** — mặc định web gọi `/api` (same-origin nhờ rewrite). Nếu KHÔNG
   dùng rewrite, set `VITE_API_BASE_URL` = URL API project (xem `.env.example`).
5. **Password gate** — app hiển thị modal nhập `APP_ACCESS_PASSWORD` lần đầu mở
   (header `x-app-password`).

> CẢNH BÁO: deploy chưa được test trên Vercel ở đây. Cấu hình runtime của API
> (Node vs Edge) có thể cần xác nhận trong dashboard Vercel — xem
> `apps/api/README.md`.

### Alternative (single project)
Có sẵn `vercel.json` ở root repo (framework `vite`, output `apps/web/dist`) để
deploy nguyên repo làm một project. Cách này bỏ qua API serverless; chỉ dùng nếu
bạn tự host API riêng và set `VITE_API_BASE_URL`.

