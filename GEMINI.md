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

---

## 🧱 STRICT EXECUTION & ANTI-HALLUCINATION HARNESS (KỶ LUẬT CỨNG)

1. **Quy tắc Chống Ảo Giác (Zero-Guessing)**:
   - TUYỆT ĐỐI KHÔNG đoán mò interface, type, schema DB hoặc đường dẫn file.
   - BẮT BUỘC dùng công cụ đọc file (`view_file`, `grep_search`) để nắm chắc ngữ cảnh trước khi can thiệp mã nguồn.
2. **Quy tắc Sửa Đổi Tối Thiểu (Surgical Edits)**:
   - Chỉ chỉnh sửa đúng các dòng liên quan, bảo toàn toàn bộ logic và comment hiện có, không viết lại toàn bộ file.
3. **Quy tắc Vòng Lặp Tự Sửa Lỗi Bắt Buộc (Enforced Self-Correction)**:
   - Hệ thống được trang bị Stop Hook tự động kiểm tra `typecheck`.
   - Nếu còn lỗi TypeScript hoặc Lint, Agent PHẢI tự động phân tích và khắc phục triệt để, không được dừng lại khi chưa đạt trạng thái Clean Build.
4. **Tác Phong Phản Hồi**:
   - Ngắn gọn, tập trung thẳng vào giải pháp kỹ thuật và kết quả thực tế, không giải thích lý thuyết rườm rà.

---

## 🚀 QUY CHUẨN PHÁT TRIỂN & KIẾN TRÚC NEXT.JS (PROJECT GUIDELINES & DEVELOPER INSTRUCTIONS)

### 1. Development & Fast Refresh Rules (CRITICAL)
- **Do NOT terminate the dev server**: Next.js sử dụng Fast Refresh. Việc khởi động lại `npm run dev` hoặc dev server thường xuyên là không cần thiết và làm mất cache build.
- **HMR Preservation**: Mọi thay đổi trong `src/` (components, hooks, lib, features) sẽ tự động cập nhật. Chỉ khởi động lại server khi thay đổi file cấu hình gốc: `next.config.ts`, `tailwind.config.js` hoặc file môi trường `.env`.
- **Build Verification**: Sử dụng `npm run build` (hoặc `next build`) và `npm run typecheck` để kiểm tra lỗi TypeScript và tối ưu hóa trước khi hoàn tất, nhưng không chạy production build lặp đi lặp lại trong quá trình code giao diện UI thông thường.

### 2. Architecture & Design Standards
- **Framework & Tech Stack**: Next.js (App Router), TypeScript 5.x, Tailwind CSS, Radix UI / Shadcn UI.
- **Phân bổ thư mục giải pháp (Modular Directory)**:
  - `packages/shared/src/domain/` (Pure Domain Core):
    - `aggregates/`: Chứa các Aggregate Roots (`LabReportAggregate`, `InvoiceAggregate`). Là nơi DUY NHẤT quản lý vòng đời và chuyển đổi trạng thái (FSM). **CẤM TẠO THƯ MỤC `stateMachine/` HAY CLASS STATEMACHINE RỜI RẠC**.
    - `valueObjects/`: Chứa TOÀN BỘ Value Objects (bao gồm cả Product Types và Sum Types / Discriminated Unions như `ReportDocumentState`, `InvoicePaymentState`, `ReportKind`, `TestResultValue`). **CẤM TẠO THƯ MỤC `adt/` RIÊNG BIỆT**.
    - `services/`: Domain Services tính toán thuần túy (Allergen, AutoConclusion, ReportClassification).
    - `events/`: Domain Events & Domain Event Bus.
    - **TUYỆT ĐỐI KHÔNG** chứa React Component, DOM API hay import từ `@infra`/external libraries.
  - `apps/web/src/app/`: File-based routing, Server Components (RSC), Layouts, API Route Handlers.
  - `apps/web/src/features/<feature-name>/`: Vertical Slices chứa UI components, custom hooks, use cases chuyên biệt của từng nghiệp vụ.
  - `apps/web/src/components/`: UI components dùng chung (Atomic Design: atoms, molecules, organisms, layouts).
  - `apps/web/src/hooks/`: Custom React Hooks quản lý logic UI và điều phối state.
  - `apps/web/src/infrastructure/`: Kết nối bên ngoài (Supabase, Cloudinary, LocalStorage/IndexedDB, Zalo, Excel, PDF rasterization).
- **Cơ chế Caching & Quản lý State**:
  - **Server-side**: Next.js Data Cache & Request Memoization.
  - **Server State**: TanStack Query (React Query) cho cache và đồng bộ dữ liệu từ server.
  - **Client Staged / Workspace State**: Zustand (kèm persist / IndexedDB) quản lý phiên làm việc, trạng thái dirty tracking và staged changes.
  - **Transient UI State**: `useState` / `useReducer` cho các tương tác cục bộ (modal, dropdown, hover).

### 3. UI/UX Interaction Principles
- **Component-Driven Interaction**:
  - **Global Toolbar**: Chỉ chứa các tác vụ macro (Xuất PDF hàng loạt, Tạo mới, Đồng bộ Cloud).
  - **Context Menu**: Sử dụng Radix UI Context Menu (`@radix-ui/react-context-menu` / Dropdown Menu) khi click chuột phải hoặc bấm nút tùy chọn trên từng dòng dữ liệu để thực hiện tác vụ đặc thù (Sửa, Xóa, Đổi trạng thái, In lẻ).
  - **Double Click Mapping**: Double click vào dòng hoặc thẻ dữ liệu tự động mở chi tiết hoặc modal chỉnh sửa.
  - **Optimistic UI**: Áp dụng cập nhật giao diện lập tức (Optimistic Updates) trước khi server phản hồi để bảo đảm trải nghiệm desktop-grade mượt mà.
  - **Virtualization**: Với các danh sách hoặc bảng dữ liệu có tiềm năng vượt quá 100 phần tử, ưu tiên sử dụng Virtual Windowing (`@tanstack/react-virtual`) để chống tràn bộ nhớ DOM.

### 4. Domain State Machine & Lifecycle Standards (TypeScript ADTs)
- **Discriminated Unions làm Value Objects dạng ADT (Sum Types)**:
  - Mọi vòng đời trạng thái phải được mô hình hóa bằng Closed Tagged Union đặt tại `packages/shared/src/domain/valueObjects/`, cấm dùng tổ hợp boolean flags.
  - Mọi thuộc tính trong union variant phải là `readonly` để bảo đảm tính bất biến.
  ```typescript
  export type ReportDocumentState =
    | { readonly status: 'DRAFT'; readonly totalTests: number; readonly completedTests: number }
    | { readonly status: 'RESULTED'; readonly resultedAt: string; readonly totalTests: number }
    | { readonly status: 'EXPORTED'; readonly cloudPdfUrl: string; readonly exportedAt: string }
    | { readonly status: 'OUTDATED'; readonly originalPdfUrl: string; readonly modifiedAt: string }
    | { readonly status: 'DELIVERED'; readonly deliveredAt: string; readonly recipientPhone?: string };
  ```
- **Aggregate Root là chủ sở hữu duy nhất của State Transitions**:
  - Không tạo các file FSM/StateMachine bên ngoài. Mọi chuyển đổi trạng thái và logic nghiệp vụ bảo vệ invariant được đóng gói trong các phương thức của Aggregate Root (`LabReportAggregate`, `InvoiceAggregate`).
  - Use cases và UI hooks TUYỆT ĐỐI KHÔNG mutate trực tiếp dữ liệu thô mà phải thông qua Aggregate Root:
    `const updated = LabReportAggregate.fromSnapshot(report).computeStatusSummary(isPaid);`
    `const invoice = InvoiceAggregate.fromSnapshot(raw).markPaid(method, cashier).toSnapshot();`
- **Pure State Transitions**: Mọi hàm chuyển đổi trạng thái bên trong Aggregate hoặc Value Object phải là Pure Function không gây side-effect:
  `const nextState = transition(currentState, event);`

### 5. Automated Architectural Guards (Lint & Test)
- **Strict Architecture Boundaries**:
  - `packages/shared/src/domain/` KHÔNG ĐƯỢC PHÉP import từ `apps/web/`, `react`, hay bất kỳ external library nào.
  - Feature Slice A không được import trực tiếp nội bộ của Feature Slice B. Giao tiếp qua Props, Callbacks hoặc Domain Event Bus.
- **Quy tắc cấm "Fat Components"**:
  - Mỗi file component không nên vượt quá 150 - 200 dòng. Khi vượt quá, bắt buộc tách thành các sub-components hoặc trích xuất custom hooks.
- **Testing Pyramid**:
  - Sử dụng **Vitest** để kiểm thử 100% logic Pure Domain Core, State Machine, Value Objects và Aggregates.
  - Sử dụng **Playwright / Cypress** cho kiểm thử tích hợp luồng UI và Export PDF.

### 6. Functional DDD & Type-Driven Design
- **Value Objects**:
  - Dùng Zod để parse và validate invariants tại ranh giới dữ liệu (Form/API I/O). Sau khi parse thành Value Object, đối tượng trở thành bất biến (`readonly` / `Object.freeze`).
- **Exhaustive Pattern Matching**:
  - Sử dụng `switch (state.type)` kèm `assertNever(state)` hoặc phương thức `.match(...)` của ADT để bảo đảm xử lý triệt để 100% các biến thể trạng thái.
- **Result Pattern**:
  - Tránh throw exceptions cho logic nghiệp vụ thông thường. Sử dụng wrapper object:
    `type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };`
- **Anti-Primitive Obsession (Brand Types & Value Objects)**:
  - Không lạm dụng kiểu `string` thô cho các định danh có ngữ nghĩa. Sử dụng Brand Types hoặc Value Object (như `InvoiceCode`, `Money`, `PatientProfile`).

### 7. Aggregate Root & Boundary Ownership
- **Workspace Context / Store**: Quản lý tính toàn vẹn của Snapshot hiện tại, Staged Changes và Deep Dirty Checking.
- **Phân công trách nhiệm rõ ràng**:
  - Server Actions / Infrastructure Services: Đóng vai trò là **Command Handlers / Gateways**.
  - Custom Hooks: Đóng vai trò là **Presenters & Coordinators**.
  - UI Components: Chỉ nhận props thuần túy và trigger events.
- **Dirty Guard Protection**: Kích hoạt `useBeforeUnload` bảo vệ khi có thay đổi chưa lưu, tránh mất dữ liệu khi người dùng vô tình reload hoặc đóng tab.

---

### 8. Bảng Quy Đổi Tương Đương Kỹ Thuật (.NET/Avalonia ↔ Next.js/TypeScript)

| Tác vụ | Nền tảng .NET (C# / Avalonia) | Hệ sinh thái Next.js (TypeScript) |
| :--- | :--- | :--- |
| **Chạy Development** | `dotnet watch run` | `npm run dev` |
| **Kiểm tra kiểu & lỗi** | `dotnet build` | `npm run typecheck` (`tsc --noEmit`) |
| **Kiểm thử kiến trúc** | `NetArchTest` | `eslint-plugin-boundaries` / `dependency-cruiser` |
| **Kiểm thử đơn vị** | `xUnit` / `NUnit` | `Vitest` |
| **Kiểm thử E2E / UI** | `Appium` / `Avalonia.Headless` | `Playwright` |
| **State Management** | `CommunityToolkit.Mvvm` / `ReactiveUI` | `Zustand` / `useReducer` / `TanStack Query` |
| **Validation & Invariants** | `FluentValidation` | `Zod` / `Valibot` |
| **UI Component** | `AXAML` / `ReactiveUserControl` | `React Component` (RSC + Client Components) |
| **Bảo vệ ranh giới Domain** | `.NET Class Library` (Core DLL) | Monorepo Package (`packages/shared/src/domain`) |
| **Xử lý luồng lỗi** | `OneOf<T, TError>` / `LanguageExt` | `Result<T, E>` / Discriminated Unions |


