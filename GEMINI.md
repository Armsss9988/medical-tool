# GEMINI.md - Quy Tắc Cứng Dành Cho AI Agent (Strict Rules)

## 📌 QUY ĐỊNH VỀ GITHUB & ĐẨY CODE (STRICT PAUSE)

### 🚨 QUY TẮC CỨNG #1: TẠM THỜI KHÔNG PUSH GÌ LÊN GITHUB
- **TUYỆT ĐỐI KHÔNG TỰ Ý COMMIT HOẶC PUSH CODE LÊN GITHUB** trong giai đoạn hiện tại (trừ khi có chỉ thị rõ ràng cụ thể từ người dùng yêu cầu push).
- Mọi thao tác phát triển tính năng, sửa lỗi, tinh chỉnh giao diện chỉ thực hiện trên môi trường **LOCAL**.
- Bắt buộc kiểm thử build local (`npm run build` đạt 0 lỗi) và kiểm tra trên trình duyệt local trước khi hoàn tất mỗi tác vụ.

---

### 🛡️ QUY TRÌNH KHI ĐƯỢC YÊU CẦU PUSH (CHỈ KHI USER YÊU CẦU CỤ THỂ):
1. **Kiểm thử Build Local**: Chạy `npm run build`, đảm bảo 0 lỗi TypeScript & Lint.
2. **Rà soát danh sách File**: `git status` đảm bảo không sót file nào.
3. **Thực hiện Push qua GitHub MCP (`push_files`)**: Đẩy đầy đủ tất cả các file thay đổi/tạo mới.
4. **Đồng bộ**: `git fetch origin main; git reset --hard origin/main`.

---

### ⚙️ QUY TẮC CỨNG GIỮ NGUYÊN KIẾN TRÚC VÀ TÍNH NĂNG
1. **Vercel & Supabase Cloud Integration**:
   - Tất cả các API Key (URL Supabase, Anon Key, Cloudinary Preset) phải ưu tiên lấy từ biến môi trường (`import.meta.env.VITE_SUPABASE_URL`, `import.meta.env.VITE_SUPABASE_ANON_KEY`).
2. **Xuất PDF & Mã QR 1-Click**:
   - Giữ nguyên cơ chế chuyển đổi màu OKLCH toán học (`oklchToRgb`) và render Lossless PNG để file PDF xuất ra khớp 100% với màn hình Xem Trước.
   - Giữ nguyên bộ lưu trữ 3 tầng chịu lỗi (Supabase Storage $\rightarrow$ Cloudinary $\rightarrow$ Local Data URL).
3. **Mẫu Phiếu Trả Kết Quả Y Khoa**:
   - Giữ đúng bảng thông tin bệnh nhân 12 trường (6 hàng, 4 cột) với tên bệnh nhân và số bệnh phẩm màu đỏ in đậm.
