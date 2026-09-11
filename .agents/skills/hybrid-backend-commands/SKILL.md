---
name: hybrid-backend-commands
description: Use when implementing financial transactions, invoice payments, status changes, cross-entity synchronization, PDF export transactions, or database consistency in GoLab.
---

# Hybrid Backend Command & State Consistency Pattern

## 1. Overview & Core Philosophy
GoLab utilizes a **Hybrid Architecture** balancing client-side speed with server-authoritative integrity:
- **Frontend (Presentation & Fast Interaction)**: Responsible for 0ms typing responsiveness, rapid test navigation (Enter/Tab), SmartFill, auto-conclusions, allergen alerts, and client-side Lossless PDF Canvas rendering.
- **Backend (Consistency & Invariant Guardians)**: Responsible for all **Commitment Operations** (financial transactions, payment collections, invoice cancellations, PDF version increments) executed within atomic PostgreSQL transactions (`db.transaction`).

---

## 2. When to Use & When NOT to Use

### Use This Pattern When:
- Collecting payment for an invoice (`payInvoiceTransaction`).
- Cancelling or refunding an invoice (`cancelInvoiceTransaction`).
- Registering a cloud-exported PDF and incrementing its version ledger.
- Changing state that impacts multiple database tables simultaneously (e.g., Invoices $\leftrightarrow$ Medical Reports).
- Creating or modifying backend route handlers for business operations.

### Do NOT Use for:
- Pure client-side draft edits (typing in test result inputs, updating draft patient details in Zustand store).
- Pure UI interactions (opening/closing modals, toggling dropdowns, toast alerts).
- Pure domain calculations (calculating test prices, auto-conclusion parsing, allergen grading).

---

## 3. Strict Architectural Prohibitions (Negative Constraints)

When writing code in GoLab, AI agents must **NEVER**:

1. **NO Side-Effects in React State Updaters**:
   - ❌ **FORBIDDEN**:
     ```typescript
     setInvoices((prev) => {
       postInvoice(updated); // ❌ VIOLATION: Runs twice in StrictMode, breaks pure state function
       return next;
     });
     ```
   - ✅ **CORRECT**: State updaters must be 100% pure functions. Perform API calls outside `setState`:
     ```typescript
     setInvoices(next);
     await postInvoice(updated);
     ```

2. **NO Cross-Entity Synchronization via Browser Event Bus**:
   - ❌ **FORBIDDEN**: Listening to `INVOICE_PAID` on the browser and then calling `postReport` down to the DB.
   - ✅ **CORRECT**: Cross-entity consistency is **100% the responsibility of the Backend in a single Database Transaction**.

3. **NO Generic CRUD Dumps for Transactions**:
   - ❌ **FORBIDDEN**: Sending a full raw JSON payload to `POST /api/invoices` and expecting the client to manually sync the report afterwards.
   - ✅ **CORRECT**: Call explicit Command Endpoints:
     - `POST /api/invoices/[id]/pay`
     - `POST /api/invoices/[id]/cancel`
     - `POST /api/reports/[id]/export-pdf`

4. **NO Multi-Table Updates Without Database Transactions**:
   - Any backend operation updating both `invoices` and `reports` MUST be wrapped inside `await db.transaction(async (tx) => { ... })`.

---

## 4. Canonical Implementation Pattern

### A. Backend Route Handler (`apps/web/app/api/...`)
```typescript
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = verifyAuth(req);
  if (authError) return authError;

  const { id } = await params;
  const db = getDbSafe();
  if (!db) {
    if (process.env.NODE_ENV === 'development' || !process.env.DATABASE_URL) {
      return NextResponse.json({ success: true, localOnly: true });
    }
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const result = await payInvoiceTransaction(db, id, body);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
```

### B. Backend Transaction Function (`apps/web/lib/repo.ts`)
```typescript
export async function payInvoiceTransaction(
  db: Db,
  invoiceId: string,
  paymentData: { paymentMethod?: string; cashier?: string; paidAt?: string }
): Promise<{ invoice: Invoice; report?: MedicalReport }> {
  return await db.transaction(async (tx) => {
    const rawInvoice = await getInvoiceById(tx as unknown as Db, invoiceId);
    if (!rawInvoice) throw new Error(`Invoice not found: ${invoiceId}`);

    const invAgg = InvoiceAggregate.fromSnapshot(rawInvoice);
    invAgg.markPaid(paymentData.paymentMethod as any, paymentData.cashier, paymentData.paidAt);
    const updatedInvoice = invAgg.toSnapshot();
    await saveInvoice(tx as unknown as Db, updatedInvoice);

    let updatedReport: MedicalReport | undefined;
    if (updatedInvoice.reportId) {
      const rawReport = await getMedicalReportById(tx as unknown as Db, updatedInvoice.reportId);
      if (rawReport) {
        const repAgg = LabReportAggregate.fromSnapshot(rawReport);
        repAgg.markPaymentCollected(updatedInvoice.id, updatedInvoice.paidAt);
        updatedReport = repAgg.toSnapshot();
        await saveMedicalReport(tx as unknown as Db, updatedReport);
      }
    }

    return { invoice: updatedInvoice, report: updatedReport };
  });
}
```

### C. Client Gateway & Hook Consumption (`WorkspaceContext` / `useInvoiceManager`)
```typescript
const payInvoice = async (id: string, data: PaymentData) => {
  const res = await apiClient.payInvoice(id, data);
  if (res.success) {
    if (res.invoice) saveOrUpdateInvoice(res.invoice);
    if (res.report && onReportUpdated) onReportUpdated(res.report);
  }
  return res;
};
```

---

## 5. Rationalization Table & Red Flags

| Excuse / Rationalization | Reality |
| :--- | :--- |
| *"It's simpler to just emit an event and let the report hook save itself."* | **False.** Causes race conditions, double DB writes in StrictMode, and incomplete saves if the user closes the browser. |
| *"I'll just put the `postInvoice` call inside `setInvoices(prev => ...)` so it has the latest state."* | **Strictly Forbidden.** React state updaters must be pure functions. Side effects inside updaters fire multiple times and cause subtle bugs. |
| *"A generic `POST /api/invoices` is enough; why make a separate `/pay` endpoint?"* | A `/pay` command enforces atomic transitions and updates the linked report in one transaction. A generic CRUD endpoint cannot safely manage multi-entity invariants. |
| *"Local-only mode doesn't need transactions."* | The transaction logic must be implemented consistently on the backend. When `!db`, the handler returns `{ success: true, localOnly: true }` gracefully. |

---

## 6. Verification Checklist
Before completing any task modifying state transitions or transactions:
1. `npx vitest run apps/web/src/infrastructure/__tests__/repoTransactions.test.ts` (Transactions pass).
2. `npx vitest run apps/web/src/infrastructure/__tests__/invoiceCommandRoutes.test.ts` (Routes pass).
3. `npm run typecheck` (0 errors across workspace).
4. `npm test` (100% of all suites pass).
