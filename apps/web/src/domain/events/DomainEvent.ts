import { Invoice, MedicalReport, PaymentMethod, InvoiceStatus } from '../types';

export interface DomainEvent<T = unknown> {
  eventId: string;
  occurredAt: string;
  eventType: string;
  payload: T;
}

export type DomainEventHandler<T = unknown> = (event: DomainEvent<T>) => void | Promise<void>;

// 1. REPORT EVENTS
export const REPORT_EVENT_TYPES = {
  SAVED: 'REPORT_SAVED',
  DELETED: 'REPORT_DELETED',
  OUTDATED: 'REPORT_OUTDATED',
  PDF_EXPORTED: 'REPORT_PDF_EXPORTED',
  ZALO_SENT: 'REPORT_ZALO_SENT'
} as const;

export interface ReportSavedPayload {
  report: MedicalReport;
  isNew: boolean;
}

export interface ReportDeletedPayload {
  reportId: string;
  reportCode?: string;
}

export interface ReportPdfExportedPayload {
  reportId: string;
  cloudPdfUrl: string;
  qrCodeDataUrl?: string;
  pdfVersion: number;
}

export interface ReportZaloSentPayload {
  reportId: string;
  msgId?: string;
  sentAt: string;
}

// 2. INVOICE EVENTS
export const INVOICE_EVENT_TYPES = {
  CREATED: 'INVOICE_CREATED',
  PAID: 'INVOICE_PAID',
  CANCELLED: 'INVOICE_CANCELLED',
  DELETED: 'INVOICE_DELETED',
  STATUS_CHANGED: 'INVOICE_STATUS_CHANGED'
} as const;

export interface InvoiceCreatedPayload {
  invoice: Invoice;
}

export interface InvoicePaidPayload {
  invoice: Invoice;
  paymentMethod: PaymentMethod;
  paidAt: string;
  reportId?: string;
}

export interface InvoiceCancelledPayload {
  invoiceId: string;
  reportId?: string;
  reason?: string;
}

export interface InvoiceDeletedPayload {
  invoiceId: string;
  reportId?: string;
}

export interface InvoiceStatusChangedPayload {
  invoiceId: string;
  oldStatus: InvoiceStatus;
  newStatus: InvoiceStatus;
  reportId?: string;
}
