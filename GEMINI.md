# GEMINI.md - Quy Tắc Cứng Dành Cho AI Agent (Strict Rules)

## 📌 QUY TRÌNH QUẢN LÝ MÃ NGUỒN VÀ ĐẨY CODE LÊN GITHUB (GITHUB MCP)

### 🚨 QUY TẮC CỨNG #1: XÁC NHẬN ĐẦY ĐỦ TẤT CẢ FILE TRƯỚC KHI COMMIT & PUSH
1. **Kiểm tra trạng thái cây thư mục**:
   - Trước khi commit hoặc push, BẮT BUỘC phải kiểm tra lại tất cả các file bị thay đổi (`modified`) hoặc tạo mới (`untracked/new`) trong dự án.
   - **KHÔNG ĐƯỢC PHÉP BỎ SÓT BẤT KỲ FILE NÀO**, bao gồm:
     - File giao diện (`src/components/*.tsx`)
     - File nghiệp vụ & Service (`src/infrastructure/*.ts`, `src/hooks/*.ts`, `src/domain/*.ts`)
     - File dữ liệu & Tài nguyên (`src/data/*.ts`, `src/assets/*.ts`, `src/assets/*`)
     - File cấu hình (`vite.config.ts`, `tsconfig.json`, `package.json`)

2. **Đồng bộ hóa 100% khi dùng GitHub MCP Tool (`push_files`)**:
   - Khi gọi công cụ `github-mcp-server` $\rightarrow$ `push_files`, mảng `files` BẮT BUỘC phải bao gồm **TẤT CẢ** các file đã tạo mới hoặc chỉnh sửa.
   - Tuyệt đối **KHÔNG** chỉ push file `.tsx` mà bỏ quên các file module `.ts` hay asset phụ thuộc (tránh gây lỗi `ENOENT: no such file or directory` hoặc `Cannot find module` trên máy chủ Vercel / Linux).

---

### 🛡️ QUY TRÌNH 4 BƯỚC BẮT BUỘC KHI ĐẨY CODE:

- **Bước 1: Kiểm thử Build Local**
  - Chạy lệnh `npm run build` local.
  - Phải đảm bảo **0 lỗi TypeScript (tsc)**, **0 lỗi Lint (eslint)** và build ra thư mục `dist/` thành công trước khi push.

- **Bước 2: Rà soát danh sách File (`git status`)**
  - Đảm bảo tất cả các file mới khởi tạo (ví dụ: asset mã hóa, helper function, component mới) đã có đầy đủ nội dung.

- **Bước 3: Thực hiện Push qua GitHub MCP Tool (`push_files`)**
  - Truyền đầy đủ đường dẫn `path` và nội dung `content` của từng file vào đối tượng `files`.
  - Target repository: `Armsss9988/medical-tool`, Branch: `main`.

- **Bước 4: Xác minh đồng bộ Remote & Local**
  - Xác nhận response commit từ GitHub API.
  - Đồng bộ `HEAD` local với `origin/main` (`git fetch origin main && git reset --hard origin/main`).

---

### ⚙️ QUY TẮC CỨNG GIỮ NGUYÊN KIẾN TRÚC VÀ TÍNH NĂNG
1. **Vercel & Supabase Cloud Integration**:
   - Tất cả các API Key (URL Supabase, Anon Key, Cloudinary Preset) phải ưu tiên lấy từ biến môi trường (`import.meta.env.VITE_SUPABASE_URL`, `import.meta.env.VITE_SUPABASE_ANON_KEY`).
2. **Xuất PDF & Mã QR 1-Click**:
   - Giữ nguyên cơ chế chuyển đổi màu OKLCH toán học (`oklchToRgb`) và render Lossless PNG để file PDF xuất ra khớp 100% với màn hình Xem Trước.
   - Giữ nguyên bộ lưu trữ 3 tầng chịu lỗi (Supabase Storage $\rightarrow$ Cloudinary $\rightarrow$ Local Data URL).
3. **Mẫu Phiếu Trả Kết Quả Y Khoa**:
   - Giữ đúng bảng thông tin bệnh nhân 12 trường (6 hàng, 4 cột) với tên bệnh nhân và số bệnh phẩm màu đỏ in đậm.
