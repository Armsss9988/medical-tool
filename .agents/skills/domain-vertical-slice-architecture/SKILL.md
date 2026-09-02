---
name: domain-vertical-slice-architecture
description: Enforces Domain-Driven Vertical Slice Architecture (VSA + Rich Domain Core) in GoLab. Use when generating, refactoring, or reviewing code, creating new features, modifying medical domain logic, handling state transitions, or checking architecture boundaries.
---

# Domain-Driven Vertical Slice Architecture (VSA + Rich Domain Core)

## 1. Core Directives & Mental Model
Antigravity enforces **Vertical Slice Architecture over a Pure Rich Domain Core** for the GoLab codebase:
* **Features (Outer Ring)**: `apps/web/src/features/<feature-name>/`. Slice-driven, pragmatic, self-contained orchestrators containing their own UI components, hooks, use cases, and public `index.ts`.
* **Domain Core (Inner Ring)**: `packages/shared/src/domain/`. Pure, immutable, zero external dependencies (no React, no DOM, no fetch, no `@infra`), mathematically verified calculations and state transitions.
* **Core Philosophy**: **"Make Illegal States Unrepresentable"** using TypeScript Discriminated Unions instead of boolean flag explosions.

---

## 2. Directory Placement Decision Tree
Before creating or moving any file, run this check:
* **Is it a business invariant, medical calculation, state machine, domain error, pricing rule, or auto-conclusion?**
  -> 🟢 Place in `packages/shared/src/domain/` (Pure TypeScript only).
* **Is it a feature-specific UI component, hook, use case, or slice ViewModel?**
  -> 🔵 Place in `apps/web/src/features/<feature-name>/` (`components/`, `hooks/`, `usecases/`, with public API in `index.ts`).
* **Is it external I/O, database access (Supabase), cloud upload (Cloudinary), PDF/Canvas rasterization, QR generator, Excel exporter, or Zalo client?**
  -> 🟡 Place in `apps/web/src/infrastructure/`.
* **Is it a cross-cutting React state container (active workspace session, toast, modal)?**
  -> 🟣 Place in `apps/web/src/contexts/`.

---

## 3. Strict Prohibitions (Negative Constraints)
When generating or modifying code, you must **NEVER**:
1. **NO Boolean State Flags**: Never use loose boolean combinations (`isMixed && !isAllergen && isPaid && isExported`). States MUST be modeled as closed hierarchies using Discriminated Unions (Tagged Unions).
2. **NO Cross-Slice Imports**: Feature slice A (`apps/web/src/features/lab-testing`) must NEVER import components, hooks, or handlers directly from Feature slice B (`apps/web/src/features/billing-revenue`). Slices must interact via Props, Callbacks, or Domain Event Bus.
3. **NO Side-Effects or UI in Domain Core**: Domain files must NEVER import `react`, `react-dom`, DOM globals (`document`, `window`), `@infra/*`, `@components/*`, or HTTP/SDK clients.
4. **NO Premature Extraction**: Do not harvest code into `common/` or `utils/` for structural or superficial similarities. Only place logic into `domain/` when it represents a true medical business invariant or is required across 3+ slices.
5. **NO Unexported Private Slice Internals**: Outer application code (`App.tsx`, `MainWorkspace.tsx`) must only import from the slice's public barrel: `@features/<feature-name>`.

---

## 4. Code Implementation Standards

### A. "Make Illegal States Unrepresentable" (Discriminated Unions)
Always model domain entities and reports with an explicit `kind` or `status` tag:
```typescript
// ❌ WRONG: Boolean flag explosion (Fragile & prone to impossible combinations)
interface ReportState {
  isClinical: boolean;
  isAllergen: boolean;
  isHybrid: boolean;
  isExported: boolean;
  cloudPdfUrl?: string; // Can be undefined even if isExported === true!
}

// ✅ RIGHT: Discriminated Union (Illegal states are compile errors)
export type ClassifiedReport =
  | { readonly kind: 'clinical'; readonly elementId: PrintElementId; readonly badge: ReportTypeBadge }
  | { readonly kind: 'allergen'; readonly elementId: PrintElementId; readonly badge: ReportTypeBadge }
  | { readonly kind: 'hybrid'; readonly elementId: PrintElementId; readonly badge: ReportTypeBadge };
```

### B. Exhaustive Pattern Matching (`assertNever`)
All state transitions and domain matchers must use exhaustive checking so that adding a new variant causes a compile-time error if unhandled:
```typescript
import { assertNever } from '@domain/utils/assertNever';

export function handleReport(report: ClassifiedReport) {
  switch (report.kind) {
    case 'clinical': return renderClinical(report);
    case 'allergen': return renderAllergen(report);
    case 'hybrid':   return renderHybrid(report);
    default:
      // TypeScript will report a red compile error here if any kind is missing:
      return assertNever(report);
  }
}
```

---

## 5. Architectural Quality Assurance & Verification
After writing or refactoring code, you must verify the architecture:
1. **TypeScript Typecheck**:
   `npm run typecheck` (Ensures exhaustive pattern matching and 0 type errors).
2. **Architecture Linter**:
   `npm run lint` (Checks boundary violations via `eslint-plugin-boundaries`).
3. **Domain & Feature Test Suites**:
   `npm run test` (All Vitest unit and integration test suites pass 100%).
4. **Production Build**:
   `npm run build` (Clean Next.js production build).
