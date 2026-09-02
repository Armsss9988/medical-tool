// ─── FEATURE SLICE: BILLING & REVENUE ───────────────────────────────────────
// Self-contained slice for invoice creation, payment collection, and revenue management.

export { default as RevenueManagerModal } from './components/RevenueManagerModal';
export { default as InvoiceModal } from './components/InvoiceModal';
export { default as PrintReceiptView } from './components/PrintReceiptView';
export { useInvoiceManager } from './hooks/useInvoiceManager';
export { useInvoiceActions } from './hooks/useInvoiceActions';
export { CreateInvoiceUseCase } from './usecases/CreateInvoiceUseCase';
export { CollectPaymentUseCase } from './usecases/CollectPaymentUseCase';
export { CancelInvoiceUseCase } from './usecases/CancelInvoiceUseCase';
