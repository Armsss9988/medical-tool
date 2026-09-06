# Next.js & Functional DDD Architecture Guidelines

This rule file codifies the project standards for Next.js (App Router), TypeScript, and Functional Domain-Driven Design in GoLab.

## 1. Fast Refresh & Local Dev Discipline
- Do not kill or restart `npm run dev` unnecessarily.
- Preserve Hot Module Replacement (HMR) cache.
- Run `npm run typecheck` (`tsc --noEmit`) for fast verification instead of full production builds during iterative development.

## 2. Directory Separation & Boundaries
- `packages/shared/src/domain/`: Pure Domain Core. Zero dependencies on React, DOM globals, or `@infra`.
  - `aggregates/`: Aggregate Roots (`LabReportAggregate`, `InvoiceAggregate`) - Nơi duy nhất quản lý Invariants và State Transitions (FSM). TUYỆT ĐỐI KHÔNG tạo thư mục `stateMachine/` hay các class StateMachine rời rạc.
  - `valueObjects/`: TẤT CẢ Value Objects (bao gồm cả Product Types như `Money`, `PatientProfile` và Sum Types / Closed ADTs như `ReportDocumentState`, `InvoicePaymentState`, `ReportKind`, `TestResultValue`). TUYỆT ĐỐI KHÔNG tạo thư mục `adt/` riêng biệt.
  - `services/`: Domain Services tính toán thuần túy.
  - `events/`: Domain Events & Event Bus.
- `apps/web/src/features/<feature>/`: Self-contained Vertical Slices with UI components, custom hooks, and use cases.
- `apps/web/src/components/`: Reusable Atomic UI elements.
- `apps/web/src/infrastructure/`: External integrations (DB, Cloudinary, Storage, PDF canvas, Excel, Zalo).
- `apps/web/src/hooks/` and `apps/web/src/contexts/`: UI state coordinators and presenters.

## 3. Aggregate Roots & Finite State Machines via Value Objects (ADTs)
- Replace loose boolean flags with Closed Discriminated Unions in `domain/valueObjects/`.
- All union properties must be `readonly`.
- All state transitions and business lifecycle invariants must be mediated by Aggregate Roots (`LabReportAggregate`, `InvoiceAggregate`).
- Feature slices, use cases, and hooks must NEVER directly mutate entity snapshots; they must invoke domain methods on Aggregate Roots:
  `const updated = LabReportAggregate.fromSnapshot(report).computeStatusSummary(isPaid);`
  `const invoice = InvoiceAggregate.fromSnapshot(raw).markPaid(method, cashier).toSnapshot();`
- Exhaustive pattern matching is mandatory using `assertNever(state)` or `.match(...)`.

## 4. Component Size Limit
- Avoid "Fat Components": Keep components concise (typically <= 150 - 200 lines). Extract sub-components and custom hooks when complexity grows.

## 5. Result Pattern & Value Objects
- Avoid throwing exceptions for expected business errors; return `Result<T, E>`.
- Use Zod schemas at boundaries and freeze Value Objects upon validation.
