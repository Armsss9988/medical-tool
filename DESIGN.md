---
version: 1.0
name: GoLab-Medical-Design-System
source-inspiration: Linear.app (adapted for Vietnamese Medical Lab context)
description: >
  GoLab là ứng dụng quản lý phòng xét nghiệm y tế chuyên nghiệp cho phòng khám Việt Nam.
  Design language kế thừa từ Linear.app — dark header navy (#0f172a) kết hợp content surface
  trắng nhạt (#f8fafc), accent sky-blue (#0284c7) thay cho lavender Linear gốc để phù hợp
  ngữ cảnh y tế (tin cậy, chuyên nghiệp, dễ đọc dưới ánh đèn phòng khám).
  Typography dùng Inter (humanist sans) cho UI + JetBrains Mono cho số liệu xét nghiệm.
  Toàn bộ palette được thiết kế để hoạt động tốt cả trên màn hình desktop và in giấy A4.

# ─────────────────────────────────────────────
# COLORS
# ─────────────────────────────────────────────
colors:
  # --- Primary Accent (Sky Blue — medical trust) ---
  primary: "#0284c7"
  primary-hover: "#0369a1"
  primary-light: "#e0f2fe"
  primary-subtle: "#f0f9ff"
  on-primary: "#ffffff"

  # --- Header / Dark Surface (Navy) ---
  # Header dùng slate-900, tạo phân tách rõ ràng header vs content
  header-bg: "#0f172a"
  header-border: "#1e293b"
  header-text: "#f8fafc"
  header-muted: "#94a3b8"

  # --- Content Canvas (Clinical White) ---
  canvas: "#f8fafc"
  surface-1: "#ffffff"
  surface-2: "#f8fafc"
  surface-3: "#f1f5f9"
  surface-4: "#e2e8f0"

  # --- Ink / Text ---
  ink: "#0f172a"
  ink-muted: "#334155"
  ink-subtle: "#64748b"
  ink-tertiary: "#94a3b8"
  ink-disabled: "#cbd5e1"

  # --- Borders ---
  hairline: "#e2e8f0"
  hairline-strong: "#cbd5e1"
  hairline-focus: "#0284c7"

  # ─── Semantic Status Colors (Medical Context) ───
  # BÌNH THƯỜNG: xanh lá emerald
  semantic-normal: "#059669"
  semantic-normal-bg: "#ecfdf5"
  semantic-normal-text: "#065f46"

  # CAO / NGUY HIỂM: đỏ
  semantic-high: "#dc2626"
  semantic-high-bg: "#fef2f2"
  semantic-high-text: "#991b1b"

  # THẤP: cam
  semantic-low: "#d97706"
  semantic-low-bg: "#fffbeb"
  semantic-low-text: "#92400e"

  # CẢNH BÁO: vàng
  semantic-warning: "#ca8a04"
  semantic-warning-bg: "#fefce8"
  semantic-warning-text: "#713f12"

  # ─── Invoice / Payment Status ───
  status-paid: "#059669"
  status-paid-bg: "#ecfdf5"
  status-unpaid: "#dc2626"
  status-unpaid-bg: "#fef2f2"
  status-pending: "#d97706"
  status-pending-bg: "#fffbeb"

  # ─── Report Document Status ───
  status-draft: "#6366f1"
  status-draft-bg: "#eef2ff"
  status-resulted: "#0284c7"
  status-resulted-bg: "#e0f2fe"
  status-exported: "#059669"
  status-exported-bg: "#ecfdf5"
  status-outdated: "#dc2626"
  status-outdated-bg: "#fef2f2"
  status-delivered: "#7c3aed"
  status-delivered-bg: "#f5f3ff"

  # ─── Print / PDF specific ───
  print-bg: "#ffffff"
  print-ink: "#000000"
  print-ink-muted: "#374151"
  print-accent: "#dc2626"
  # Tên bệnh nhân & số bệnh phẩm in đỏ đậm theo quy định phiếu y tế
  print-patient-name: "#dc2626"
  print-sample-code: "#dc2626"

# ─────────────────────────────────────────────
# TYPOGRAPHY
# ─────────────────────────────────────────────
typography:
  # Fonts sử dụng
  # - Inter: UI chính (form, button, label, navigation)
  # - JetBrains Mono / Roboto Mono: số liệu xét nghiệm, mã bệnh phẩm, timestamps
  # - Times New Roman: nội dung in ấn PDF (phiếu kết quả, biên lai)

  display:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: -0.6px

  headline:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.30
    letterSpacing: -0.3px

  section-title:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.40
    letterSpacing: -0.1px

  body-lg:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.55

  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.50

  body-strong:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.50

  body-sm:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.45

  caption:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.40

  caption-strong:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.40
    letterSpacing: 0.2px

  label:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.30
    letterSpacing: 0.5px
    textTransform: uppercase

  button:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.20

  # Dành riêng cho số liệu xét nghiệm, mã bệnh phẩm, timestamps
  mono:
    fontFamily: "'JetBrains Mono', 'Roboto Mono', 'Courier New', monospace"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.50

  mono-strong:
    fontFamily: "'JetBrains Mono', 'Roboto Mono', 'Courier New', monospace"
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1.50

  # Dành cho bảng kết quả — cần căn số chính xác
  numeric:
    fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.40
    fontVariantNumeric: tabular-nums

  # Print / PDF — phiếu kết quả theo chuẩn y tế Việt Nam
  print-body:
    fontFamily: "'Times New Roman', Times, 'Liberation Serif', serif"
    fontSize: 13px
    lineHeight: 1.45
    letterSpacing: 0.02px

# ─────────────────────────────────────────────
# SPACING
# ─────────────────────────────────────────────
spacing:
  xxs: 2px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
  xxxl: 48px
  section: 64px

# ─────────────────────────────────────────────
# BORDER RADIUS
# ─────────────────────────────────────────────
rounded:
  none: 0px
  xs: 3px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  xxl: 20px
  pill: 9999px

# ─────────────────────────────────────────────
# SHADOWS
# ─────────────────────────────────────────────
shadows:
  xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
  sm: "0 1px 3px 0 rgba(0, 0, 0, 0.10), 0 1px 2px -1px rgba(0, 0, 0, 0.10)"
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.08)"
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.08)"
  focus: "0 0 0 3px rgba(2, 132, 199, 0.25)"
  header: "0 1px 3px rgba(0,0,0,0.4)"

# ─────────────────────────────────────────────
# COMPONENTS
# ─────────────────────────────────────────────
components:

  # ─── Navigation Header ───
  top-nav:
    backgroundColor: "{colors.header-bg}"
    textColor: "{colors.header-text}"
    borderColor: "{colors.header-border}"
    typography: "{typography.body-sm}"
    height: 52px
    padding: "0 {spacing.xl}"
    shadow: "{shadows.header}"
    # Sticky trên cùng, backdrop-blur để content scroll bên dưới

  nav-brand:
    # Logo + tên phòng khám
    backgroundColor: "gradient-to-tr from-sky-600 to-cyan-500"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.xl}"
    size: "40px"
    shadow: "0 4px 12px rgba(2,132,199,0.25)"

  nav-button:
    backgroundColor: "transparent"
    textColor: "{colors.header-muted}"
    textColor-hover: "{colors.header-text}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.md}"

  nav-button-primary:
    # Export PDF, tác vụ chính
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.lg}"
    shadow: "0 2px 8px rgba(2,132,199,0.30)"

  # ─── Buttons ───
  button-primary:
    backgroundColor: "{colors.primary}"
    backgroundColor-hover: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "9px {spacing.lg}"
    shadow: "{shadows.xs}"

  button-secondary:
    backgroundColor: "{colors.surface-1}"
    backgroundColor-hover: "{colors.surface-3}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline-strong}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "9px {spacing.lg}"

  button-ghost:
    backgroundColor: "transparent"
    backgroundColor-hover: "{colors.surface-3}"
    textColor: "{colors.ink-subtle}"
    textColor-hover: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "9px {spacing.lg}"

  button-danger:
    backgroundColor: "{colors.semantic-high}"
    backgroundColor-hover: "#b91c1c"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "9px {spacing.lg}"

  button-sm:
    typography: "{typography.body-sm}"
    fontWeight: 600
    padding: "5px {spacing.md}"
    rounded: "{rounded.sm}"

  # ─── Cards & Panels ───
  panel:
    # Panel chính — PatientForm, TestTable, ConclusionForm
    backgroundColor: "{colors.surface-1}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
    shadow: "{shadows.sm}"

  panel-header:
    # Tiêu đề của mỗi panel (Patient, Chỉ Số XN, Kết Luận)
    backgroundColor: "{colors.surface-2}"
    borderColor: "{colors.hairline}"
    textColor: "{colors.ink}"
    typography: "{typography.section-title}"
    padding: "{spacing.md} {spacing.lg}"
    rounded-top: "{rounded.lg}"

  modal-overlay:
    backgroundColor: "rgba(15, 23, 42, 0.6)"
    backdropBlur: "8px"

  modal:
    backgroundColor: "{colors.surface-1}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.xl}"
    shadow: "{shadows.lg}"
    padding: "{spacing.xl}"
    maxWidth: "600px"

  modal-lg:
    backgroundColor: "{colors.surface-1}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.xl}"
    shadow: "{shadows.lg}"
    padding: "{spacing.xxl}"
    maxWidth: "960px"

  # ─── Forms ───
  form-input:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline-strong}"
    borderColor-focus: "{colors.primary}"
    ring-focus: "{shadows.focus}"
    placeholderColor: "{colors.ink-tertiary}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px {spacing.md}"
    height: 36px

  form-input-sm:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline-strong}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    padding: "5px {spacing.md}"
    height: 30px

  form-label:
    textColor: "{colors.ink-muted}"
    typography: "{typography.caption-strong}"
    # Dùng uppercase label trên form nhập bệnh nhân

  form-select:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline-strong}"
    rounded: "{rounded.md}"
    padding: "8px {spacing.md}"
    height: 36px

  # ─── Data Table (TestTable — bảng chỉ số xét nghiệm) ───
  table-container:
    backgroundColor: "{colors.surface-1}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.lg}"
    shadow: "{shadows.sm}"

  table-header:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-subtle}"
    typography: "{typography.label}"
    padding: "10px {spacing.md}"
    borderBottom: "1px solid {colors.hairline-strong}"

  table-row:
    backgroundColor: "{colors.surface-1}"
    backgroundColor-hover: "{colors.primary-subtle}"
    backgroundColor-selected: "{colors.primary-light}"
    borderBottom: "1px solid {colors.hairline}"
    padding: "8px {spacing.md}"

  table-cell-numeric:
    # Giá trị kết quả xét nghiệm — tabular-nums, mono
    typography: "{typography.numeric}"
    textAlign: right

  table-cell-result-normal:
    textColor: "{colors.semantic-normal}"
    fontWeight: 600

  table-cell-result-high:
    textColor: "{colors.semantic-high}"
    fontWeight: 700

  table-cell-result-low:
    textColor: "{colors.semantic-low}"
    fontWeight: 700

  table-inline-input:
    # Input nhập kết quả trực tiếp trong bảng
    backgroundColor: "transparent"
    backgroundColor-focus: "{colors.surface-1}"
    borderColor: "transparent"
    borderColor-focus: "{colors.primary}"
    typography: "{typography.numeric}"
    rounded: "{rounded.sm}"
    padding: "4px 6px"

  # ─── Badges & Status ───
  badge-status:
    typography: "{typography.caption-strong}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"

  badge-normal:
    backgroundColor: "{colors.semantic-normal-bg}"
    textColor: "{colors.semantic-normal-text}"

  badge-high:
    backgroundColor: "{colors.semantic-high-bg}"
    textColor: "{colors.semantic-high-text}"

  badge-low:
    backgroundColor: "{colors.semantic-low-bg}"
    textColor: "{colors.semantic-low-text}"

  badge-paid:
    backgroundColor: "{colors.status-paid-bg}"
    textColor: "{colors.status-paid}"

  badge-unpaid:
    backgroundColor: "{colors.status-unpaid-bg}"
    textColor: "{colors.status-unpaid}"

  badge-draft:
    backgroundColor: "{colors.status-draft-bg}"
    textColor: "{colors.status-draft}"

  badge-exported:
    backgroundColor: "{colors.status-exported-bg}"
    textColor: "{colors.status-exported}"

  badge-outdated:
    backgroundColor: "{colors.status-outdated-bg}"
    textColor: "{colors.status-outdated}"

  # ─── Mobile Tab Switcher ───
  mobile-tab-bar:
    backgroundColor: "{colors.surface-3}"
    rounded: "{rounded.xl}"
    padding: "4px"
    shadow: "inset 0 1px 3px rgba(0,0,0,0.08)"

  mobile-tab-active:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    shadow: "{shadows.sm}"
    fontWeight: 700

  mobile-tab-inactive:
    backgroundColor: "transparent"
    textColor: "{colors.ink-subtle}"

  # ─── Toasts / Notifications ───
  toast-success:
    backgroundColor: "{colors.semantic-normal-bg}"
    textColor: "{colors.semantic-normal-text}"
    borderColor: "{colors.semantic-normal}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md} {spacing.lg}"
    shadow: "{shadows.md}"

  toast-error:
    backgroundColor: "{colors.semantic-high-bg}"
    textColor: "{colors.semantic-high-text}"
    borderColor: "{colors.semantic-high}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md} {spacing.lg}"
    shadow: "{shadows.md}"

  toast-info:
    backgroundColor: "{colors.primary-subtle}"
    textColor: "{colors.primary}"
    borderColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md} {spacing.lg}"
    shadow: "{shadows.md}"

  # ─── Report Manager / Invoice List ───
  list-row:
    backgroundColor: "{colors.surface-1}"
    backgroundColor-hover: "{colors.primary-subtle}"
    borderBottom: "1px solid {colors.hairline}"
    padding: "{spacing.md} {spacing.lg}"

  list-row-selected:
    backgroundColor: "{colors.primary-light}"
    borderLeft: "3px solid {colors.primary}"

  # ─── PDF Preview / A4 Print Frame ───
  a4-preview-container:
    # Bao quanh trang A4 preview trong modal
    backgroundColor: "{colors.surface-3}"
    padding: "{spacing.xl}"

  a4-page:
    # Trang A4 chuẩn 210mm × 297mm
    backgroundColor: "{colors.print-bg}"
    color: "{colors.print-ink}"
    fontFamily: "'Times New Roman', Times, serif"
    width: "210mm"
    minHeight: "297mm"
    padding: "14mm"
    shadow: "0 4px 20px -2px rgba(0, 0, 0, 0.12)"

  a4-patient-name:
    # Tên bệnh nhân in đỏ đậm theo quy định phiếu y tế Việt Nam
    color: "{colors.print-patient-name}"
    fontWeight: "bold"

  a4-sample-code:
    # Số bệnh phẩm in đỏ đậm
    color: "{colors.print-sample-code}"
    fontWeight: "bold"

  # ─── Loading / Skeleton ───
  skeleton:
    backgroundColor: "{colors.surface-3}"
    shimmer: "linear-gradient(90deg, {colors.surface-3} 25%, {colors.surface-4} 50%, {colors.surface-3} 75%)"
    rounded: "{rounded.sm}"

  # ─── Password Gate / Admin Lock ───
  auth-card:
    backgroundColor: "{colors.surface-1}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xxl}"
    shadow: "{shadows.lg}"
    maxWidth: "420px"

  # ═══════════════════════════════════════════
  # LAYOUT SHELL
  # ═══════════════════════════════════════════

  app-shell:
    display: "flex flex-col"
    minHeight: "100vh"
    backgroundColor: "{colors.canvas}"

  main-content-area:
    backgroundColor: "{colors.canvas}"
    padding: "{spacing.lg}"
    maxWidth: "1680px"
    marginInline: "auto"
    flex: 1

  # ─── Sidebar ───
  # Dark navy sidebar — khớp header, dùng khi mở rộng multi-module
  sidebar:
    backgroundColor: "{colors.header-bg}"
    borderRight: "1px solid {colors.header-border}"
    width: "240px"
    width-collapsed: "56px"
    padding: "{spacing.md} 0"
    transition: "width 200ms ease"

  sidebar-section-label:
    textColor: "{colors.header-muted}"
    typography: "{typography.label}"
    padding: "{spacing.xs} {spacing.lg}"
    marginTop: "{spacing.md}"

  sidebar-nav-item:
    backgroundColor: "transparent"
    backgroundColor-hover: "rgba(255,255,255,0.06)"
    textColor: "{colors.header-muted}"
    textColor-hover: "{colors.header-text}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "9px {spacing.lg}"
    margin: "1px {spacing.sm}"

  sidebar-nav-item-active:
    backgroundColor: "rgba(2, 132, 199, 0.15)"
    textColor: "{colors.primary}"
    borderLeft: "3px solid {colors.primary}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.md}"
    padding: "9px {spacing.lg}"
    paddingLeft: "13px"

  sidebar-footer:
    borderTop: "1px solid {colors.header-border}"
    padding: "{spacing.md} {spacing.lg}"
    textColor: "{colors.header-muted}"
    typography: "{typography.caption}"
    marginTop: "auto"

  # ─── Side Tab (Vertical Tab Panel) ───
  # Dùng trong modal lớn: Settings, Catalog Manager
  sidetab-container:
    display: "flex"

  sidetab-list:
    backgroundColor: "{colors.surface-2}"
    borderRight: "1px solid {colors.hairline}"
    width: "180px"
    padding: "{spacing.sm} 0"
    rounded-left: "{rounded.xl}"

  sidetab-item:
    backgroundColor: "transparent"
    backgroundColor-hover: "{colors.surface-3}"
    textColor: "{colors.ink-subtle}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "8px {spacing.lg}"
    margin: "1px {spacing.sm}"

  sidetab-item-active:
    backgroundColor: "{colors.primary-light}"
    textColor: "{colors.primary}"
    typography: "{typography.body-strong}"
    borderLeft: "2px solid {colors.primary}"
    padding: "8px {spacing.lg}"
    paddingLeft: "14px"
    rounded: "{rounded.md}"

  sidetab-content:
    backgroundColor: "{colors.surface-1}"
    padding: "{spacing.xl}"
    flex: 1
    rounded-right: "{rounded.xl}"

  # ─── Header Anatomy (vùng chi tiết) ───
  header-zone-brand:
    # Trái: Logo + Tên phòng khám + Badge GoLab
    display: "flex items-center gap-3"
    flexShrink: 0

  header-zone-actions:
    # Giữa-phải: Các nút tác vụ macro
    display: "flex items-center gap-1"

  header-zone-clock:
    # Phải: Đồng hồ + Ngày — hidden on mobile
    display: "hidden lg:flex flex-col items-end"
    textColor: "{colors.header-muted}"
    typography-time: "{typography.mono-strong}"
    typography-date: "{typography.caption}"

  header-separator:
    width: "1px"
    height: "20px"
    backgroundColor: "{colors.header-border}"

  # ═══════════════════════════════════════════
  # BANNER / ALERT STRIP
  # ═══════════════════════════════════════════

  banner-info:
    backgroundColor: "{colors.primary-subtle}"
    borderLeft: "4px solid {colors.primary}"
    textColor: "{colors.primary}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "{spacing.md} {spacing.lg}"
    icon: "info-circle 16px"

  banner-success:
    backgroundColor: "{colors.semantic-normal-bg}"
    borderLeft: "4px solid {colors.semantic-normal}"
    textColor: "{colors.semantic-normal-text}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "{spacing.md} {spacing.lg}"
    icon: "check-circle 16px"

  banner-warning:
    # Dùng khi phiếu kết quả bị OUTDATED sau khi sửa
    backgroundColor: "{colors.semantic-warning-bg}"
    borderLeft: "4px solid {colors.semantic-warning}"
    textColor: "{colors.semantic-warning-text}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "{spacing.md} {spacing.lg}"
    icon: "alert-triangle 16px"

  banner-error:
    backgroundColor: "{colors.semantic-high-bg}"
    borderLeft: "4px solid {colors.semantic-high}"
    textColor: "{colors.semantic-high-text}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "{spacing.md} {spacing.lg}"
    icon: "x-circle 16px"

  banner-promo:
    # Thông báo tính năng mới / cập nhật hệ thống — có nút dismiss
    backgroundColor: "linear-gradient(135deg, {colors.primary-subtle}, rgba(99,102,241,0.06))"
    borderColor: "{colors.primary-light}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md} {spacing.xl}"

  # ═══════════════════════════════════════════
  # CARDS
  # ═══════════════════════════════════════════

  card-default:
    backgroundColor: "{colors.surface-1}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
    shadow: "{shadows.sm}"

  card-elevated:
    backgroundColor: "{colors.surface-1}"
    rounded: "{rounded.xl}"
    shadow: "{shadows.md}"
    padding: "{spacing.xl}"

  card-flat:
    backgroundColor: "{colors.surface-2}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"

  card-stat:
    # KPI Card — Tổng phiếu, Tổng doanh thu, ...
    # Layout: [Icon] / [Value mono-large] / [Label] / [Delta chip]
    backgroundColor: "{colors.surface-1}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xl}"
    shadow: "{shadows.sm}"

  card-stat-value:
    typography: "{typography.display}"
    fontFamily: "'JetBrains Mono', monospace"
    textColor: "{colors.ink}"

  card-stat-label:
    textColor: "{colors.ink-subtle}"
    typography: "{typography.caption-strong}"

  card-stat-delta-up:
    textColor: "{colors.semantic-normal}"
    typography: "{typography.caption-strong}"

  card-stat-delta-down:
    textColor: "{colors.semantic-high}"
    typography: "{typography.caption-strong}"

  card-report-item:
    # Dòng trong danh sách phiếu — double-click mở, right-click menu
    backgroundColor: "{colors.surface-1}"
    backgroundColor-hover: "{colors.primary-subtle}"
    borderBottom: "1px solid {colors.hairline}"
    padding: "{spacing.md} {spacing.xl}"

  card-invoice-item:
    backgroundColor: "{colors.surface-1}"
    backgroundColor-hover: "{colors.primary-subtle}"
    borderBottom: "1px solid {colors.hairline}"
    padding: "{spacing.md} {spacing.xl}"

  card-empty-state:
    backgroundColor: "{colors.surface-2}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xxxl} {spacing.xl}"
    textAlign: center

  # ═══════════════════════════════════════════
  # FOOTER
  # ═══════════════════════════════════════════

  footer:
    backgroundColor: "{colors.header-bg}"
    textColor: "{colors.header-muted}"
    borderTop: "1px solid {colors.header-border}"
    typography: "{typography.caption}"
    padding: "{spacing.md} {spacing.xl}"
    # Layout: [Tên app + version] ... [© GoLab] ... [Hỗ trợ]

  footer-link:
    textColor: "{colors.primary}"
    textColor-hover: "{colors.primary-hover}"
    typography: "{typography.caption}"

  footer-version-badge:
    backgroundColor: "rgba(2, 132, 199, 0.12)"
    textColor: "{colors.primary}"
    typography: "{typography.caption-strong}"
    rounded: "{rounded.pill}"
    padding: "1px 6px"

  # ═══════════════════════════════════════════
  # NAVIGATION
  # ═══════════════════════════════════════════

  breadcrumb:
    textColor: "{colors.ink-subtle}"
    textColor-active: "{colors.ink}"
    textColor-hover: "{colors.primary}"
    typography: "{typography.body-sm}"
    separator: "/"
    separatorColor: "{colors.ink-tertiary}"

  tabs-horizontal:
    borderBottom: "1px solid {colors.hairline}"

  tab-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink-subtle}"
    typography: "{typography.body-sm}"
    padding: "10px {spacing.lg}"
    borderBottom: "2px solid transparent"

  tab-item-active:
    textColor: "{colors.primary}"
    typography: "{typography.body-strong}"
    borderBottom: "2px solid {colors.primary}"

  pagination:
    gap: "{spacing.xs}"

  pagination-button:
    backgroundColor: "{colors.surface-1}"
    backgroundColor-hover: "{colors.surface-3}"
    backgroundColor-active: "{colors.primary}"
    textColor: "{colors.ink}"
    textColor-active: "{colors.on-primary}"
    borderColor: "{colors.hairline}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    size: "32px"

  # ═══════════════════════════════════════════
  # INTERACTIVE ELEMENTS
  # ═══════════════════════════════════════════

  search-bar:
    backgroundColor: "{colors.surface-1}"
    borderColor: "{colors.hairline-strong}"
    borderColor-focus: "{colors.primary}"
    ring-focus: "{shadows.focus}"
    textColor: "{colors.ink}"
    placeholderColor: "{colors.ink-tertiary}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    height: 38px
    icon: "search 16px {colors.ink-tertiary}"

  dropdown-menu:
    backgroundColor: "{colors.surface-1}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.lg}"
    shadow: "{shadows.lg}"
    padding: "{spacing.xs} 0"
    minWidth: "180px"
    zIndex: 50

  dropdown-item:
    backgroundColor: "transparent"
    backgroundColor-hover: "{colors.primary-subtle}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    padding: "7px {spacing.lg}"
    rounded: "{rounded.sm}"
    margin: "1px {spacing.xs}"

  dropdown-item-danger:
    backgroundColor: "transparent"
    backgroundColor-hover: "{colors.semantic-high-bg}"
    textColor: "{colors.semantic-high}"
    typography: "{typography.body-sm}"
    padding: "7px {spacing.lg}"

  dropdown-separator:
    height: "1px"
    backgroundColor: "{colors.hairline}"
    margin: "{spacing.xs} 0"

  context-menu:
    # Right-click menu trên dòng phiếu / test — z-index tối đa
    backgroundColor: "{colors.surface-1}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.lg}"
    shadow: "{shadows.lg}"
    padding: "{spacing.xs} 0"
    minWidth: "200px"

  combobox:
    backgroundColor: "{colors.surface-1}"
    borderColor: "{colors.hairline-strong}"
    borderColor-open: "{colors.primary}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    height: 36px

  combobox-dropdown:
    backgroundColor: "{colors.surface-1}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.lg}"
    shadow: "{shadows.lg}"
    maxHeight: "240px"
    overflow: "auto"

  combobox-option:
    backgroundColor: "transparent"
    backgroundColor-hover: "{colors.primary-subtle}"
    backgroundColor-selected: "{colors.primary-light}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    padding: "7px {spacing.md}"

  tooltip:
    backgroundColor: "{colors.ink}"
    textColor: "#ffffff"
    typography: "{typography.caption}"
    rounded: "{rounded.sm}"
    padding: "4px {spacing.sm}"
    shadow: "{shadows.md}"
    maxWidth: "240px"
    zIndex: 100

  switch:
    width: "36px"
    height: "20px"
    rounded: "{rounded.pill}"
    backgroundColor-off: "{colors.surface-4}"
    backgroundColor-on: "{colors.primary}"
    thumb-size: "16px"
    thumb-color: "#ffffff"
    thumb-shadow: "{shadows.sm}"
    transition: "background 150ms ease, transform 150ms ease"

  checkbox:
    size: "16px"
    rounded: "{rounded.xs}"
    borderColor: "{colors.hairline-strong}"
    borderColor-checked: "{colors.primary}"
    backgroundColor-checked: "{colors.primary}"
    checkColor: "#ffffff"

  radio:
    size: "16px"
    rounded: "{rounded.pill}"
    borderColor: "{colors.hairline-strong}"
    borderColor-checked: "{colors.primary}"
    dotColor: "{colors.primary}"

  # ═══════════════════════════════════════════
  # CONTENT COMPONENTS
  # ═══════════════════════════════════════════

  avatar:
    rounded: "{rounded.pill}"
    backgroundColor: "{colors.primary-light}"
    textColor: "{colors.primary}"
    typography: "{typography.caption-strong}"
    size-sm: "24px"
    size-md: "32px"
    size-lg: "40px"

  tag-chip:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.caption-strong}"
    rounded: "{rounded.pill}"
    padding: "2px {spacing.sm}"

  tag-chip-primary:
    backgroundColor: "{colors.primary-light}"
    textColor: "{colors.primary}"

  divider:
    height: "1px"
    backgroundColor: "{colors.hairline}"
    margin: "{spacing.lg} 0"

  divider-strong:
    height: "1px"
    backgroundColor: "{colors.hairline-strong}"

  divider-labeled:
    textColor: "{colors.ink-tertiary}"
    typography: "{typography.caption}"
    backgroundColor: "{colors.canvas}"
    padding: "0 {spacing.md}"

  collapsible-trigger:
    backgroundColor: "{colors.surface-2}"
    backgroundColor-hover: "{colors.surface-3}"
    textColor: "{colors.ink}"
    typography: "{typography.body-strong}"
    padding: "{spacing.md} {spacing.lg}"
    # Chevron icon rotate 180deg khi mở

  collapsible-content:
    backgroundColor: "{colors.surface-1}"
    borderTop: "1px solid {colors.hairline}"
    padding: "{spacing.lg}"

  progress-bar:
    backgroundColor: "{colors.surface-3}"
    fillColor: "{colors.primary}"
    height: "4px"
    rounded: "{rounded.pill}"

  progress-bar-success:
    fillColor: "{colors.semantic-normal}"

  step-indicator:
    size: "28px"
    rounded: "{rounded.pill}"
    backgroundColor-pending: "{colors.surface-3}"
    backgroundColor-active: "{colors.primary}"
    backgroundColor-done: "{colors.semantic-normal}"
    textColor: "{colors.on-primary}"
    typography: "{typography.caption-strong}"

  step-label:
    textColor-pending: "{colors.ink-tertiary}"
    textColor-active: "{colors.primary}"
    textColor-done: "{colors.semantic-normal}"
    typography: "{typography.caption}"

  empty-state:
    backgroundColor: "{colors.surface-2}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xxxl}"
    textAlign: center

  empty-state-icon:
    size: "48px"
    color: "{colors.ink-tertiary}"

  empty-state-title:
    textColor: "{colors.ink-muted}"
    typography: "{typography.section-title}"
    marginBottom: "{spacing.sm}"

  empty-state-description:
    textColor: "{colors.ink-tertiary}"
    typography: "{typography.body}"
    marginBottom: "{spacing.xl}"

  # ═══════════════════════════════════════════
  # PRINT / REPORT LAYOUT (mở rộng)
  # ═══════════════════════════════════════════

  print-header-clinic:
    # Header phòng khám trên phiếu — logo + tên + địa chỉ
    textAlign: center
    borderBottom: "2px solid #000000"
    paddingBottom: "8px"
    marginBottom: "8px"

  print-patient-info-table:
    # Bảng 12 trường (6 hàng × 4 cột) theo quy định phiếu y tế VN
    width: "100%"
    borderCollapse: "collapse"
    fontSize: "12px"

  print-result-table-header:
    backgroundColor: "#f3f4f6"
    fontWeight: "bold"
    borderBottom: "1px solid #000"
    padding: "4px 6px"

  print-result-cell:
    padding: "3px 6px"
    borderBottom: "0.5px solid #e5e7eb"
    verticalAlign: "middle"

  print-conclusion-box:
    borderTop: "1px solid #000"
    marginTop: "8px"
    paddingTop: "8px"
    minHeight: "60px"

  print-signature-zone:
    textAlign: "right"
    marginTop: "16px"
    fontStyle: "italic"
    fontSize: "12px"

  print-qrcode-zone:
    # QR Code góc dưới phải phiếu kết quả
    position: "absolute"
    bottom: "14mm"
    right: "14mm"
    size: "48px"

---

## Overview

GoLab sử dụng mô hình **"Dark Header + Clinical White Body"**:

- **Header** (`{colors.header-bg}` = `#0f172a`) — navy đậm, tạo phân tách rõ ràng, tương tự Linear nhưng với accent sky-blue thay vì lavender.
- **Body canvas** (`{colors.canvas}` = `#f8fafc`) — trắng xanh nhạt nhất, thân thiện với mắt dưới ánh đèn phòng khám, khác với Linear pure black.
- **Accent** (`{colors.primary}` = `#0284c7`) — sky-600, màu y tế chuẩn quốc tế (không phải lavender của Linear), gợi cảm giác tin cậy và sạch sẽ.

## Key Design Decisions (Khác với Linear gốc)

### 1. Semantic Color System mở rộng cho y tế
Linear gốc chỉ có `semantic-success`. GoLab cần:
- `semantic-normal/high/low/warning` cho kết quả xét nghiệm
- `status-paid/unpaid/pending` cho hóa đơn
- `status-draft/resulted/exported/outdated/delivered` cho trạng thái phiếu

### 2. Numeric Typography
Thêm `{typography.numeric}` với `tabular-nums` — bắt buộc để cột số xét nghiệm căn thẳng hàng.

### 3. Print Layer tách biệt
Linear không có print layer. GoLab có `a4-page` riêng dùng `Times New Roman` và `print-patient-name` in đỏ theo quy định phiếu y tế Việt Nam.

### 4. Mobile Tab Switcher
Thay thế Linear's side-nav bằng bottom tab switcher 3 cột (Bệnh Nhân / Chỉ Số / Kết Luận) cho màn hình nhỏ.

### 5. Dark Mode: KHÔNG áp dụng
Context phòng khám yêu cầu white background cho dễ đọc số liệu và in ấn nhất quán. Header dark chỉ dùng ở navigation bar.

## Usage for AI Agents

Khi AI agent nhận yêu cầu xây dựng UI cho GoLab:

1. **Header/Navigation** → dùng `{colors.header-bg}` navy, accent `{colors.primary}` sky-blue
2. **Form nhập bệnh nhân** → `{components.panel}` + `{components.form-input}`, label uppercase 12px
3. **Bảng xét nghiệm** → `{components.table-*}`, kết quả dùng `{typography.numeric}` + màu semantic
4. **Badges trạng thái** → luôn dùng đúng `{components.badge-*}` tương ứng, không tự ý dùng màu thô
5. **Modal** → overlay blur `{components.modal-overlay}`, content `{components.modal}`
6. **In PDF** → switch font sang `Times New Roman`, tên bệnh nhân + mã bệnh phẩm = `{colors.print-*}` đỏ đậm
7. **Số liệu** → luôn dùng `{typography.numeric}` hoặc `{typography.mono}` — KHÔNG dùng Inter cho số kết quả
