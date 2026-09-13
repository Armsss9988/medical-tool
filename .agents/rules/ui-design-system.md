# UI Design System & Frontend Aesthetics Standards

This rule file codifies the UI/UX design standards and frontend craftsmanship guidelines for GoLab Medical Tool. All AI agents generating, modifying, or reviewing React/Next.js UI components must strictly adhere to these rules.

---

## 1. 🚨 Anti-Amateur UI Harness (Mandatory Invariants)

1. **PROHIBITED: Raw Primary Colors**:
   - NEVER use raw, oversaturated generic colors (e.g. `bg-blue-500`, `bg-red-500`, `bg-green-500`, `text-black`).
   - ALWAYS use the curated clinical palette: `slate` neutral base, `sky`/`cyan` medical brand accent, `emerald` for success, `rose` for danger/abnormal, `amber` for warnings, `indigo`/`violet` for special items.
   - For status badges, ALWAYS use subtle pastel containers with high-contrast text and a semi-transparent ring:
     `bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20` (not flat solid `bg-green-500 text-white`).

2. **PROHIBITED: Missing Interactive Micro-States**:
   - Every clickable element (Button, Tab, Card, Table Row, Action Icon) MUST have:
     - Hover state (`hover:bg-...`, `hover:border-...`)
     - Active click feedback (`active:scale-[0.98] transition-transform`)
     - Accessible focus ring (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2`)
     - Clear disabled state (`disabled:opacity-50 disabled:pointer-events-none`)
     - Smooth transition timing (`transition-all duration-150 ease-out`)

3. **PROHIBITED: Raw Emojis as UI Icons**:
   - NEVER use raw emojis (e.g. 🔑, 📊, ⚙️, ❌) inside buttons, modals, or headers.
   - ALWAYS use icons from `lucide-react` with proper sizing (`size-4`, `size-5`), subtle stroke width (`stroke-[1.75]`), and harmonious icon container badges (`p-2.5 rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-500/10`).

4. **PROHIBITED: Rigid Fixed Widths / Unresponsive Layouts**:
   - NEVER hardcode fixed pixel widths on form containers or cards (`w-[400px]` without max-width).
   - Use fluid classes: `w-full max-w-md`, responsive grids (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`), and proper flex wrap.

5. **PROHIBITED: Monotone Typography for Numerical/Medical Data**:
   - Medical test values, DOB, patient codes, invoices, and monetary amounts MUST use monospace/tabular figures:
     `font-mono-num` or `font-mono tracking-tight`.

---

## 2. 💎 Visual Depth & Elevation Standards

1. **Glassmorphism & Modals**:
   - Backdrop: `fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm`
   - Dialog Container: `bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-2xl shadow-slate-900/10`
   - Smooth entry animations: `animate-in fade-in zoom-in-95 duration-200`

2. **Card Elevation**:
   - Base state: `rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200`
   - Hover state: `hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300`

3. **Buttons**:
   - Primary: Gradient depth `bg-gradient-to-b from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white shadow-xs shadow-sky-500/20 active:scale-[0.98]`
   - Secondary: `bg-slate-100 hover:bg-slate-200/80 text-slate-700 active:scale-[0.98]`
   - Destructive: `bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60 active:scale-[0.98]`
   - Ghost: `hover:bg-slate-100/80 text-slate-600 hover:text-slate-900 active:scale-[0.98]`

4. **Inputs & Form Controls**:
   - Clean slate styling: `w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20`
   - Always provide prefix/suffix icon slots when contextual (e.g. `Search`, `Lock`, `User`).

---

## 3. 📑 Exception: Medical Printable Reports

- Medical report output intended for printing/PDF generation (`#printable-medical-report`, `#preview-print-element`, `.report-page`) follows strict **ISO A4 print standards** (210mm x 297mm, OKLCH lossless colors, 12-field patient grid).
- Do NOT apply glassmorphism, backdrops, or dynamic CSS transforms to printable elements. Keep screen UI modern while preserving pixel-perfect print fidelity.
