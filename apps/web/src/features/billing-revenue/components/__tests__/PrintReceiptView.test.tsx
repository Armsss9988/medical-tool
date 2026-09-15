import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import PrintReceiptView from '../PrintReceiptView';
import { Invoice, DEFAULT_CLINIC_INFO } from '@domain/types';

describe('PrintReceiptView - Invoice & Billing PDF Generation Tests', () => {
  afterEach(() => {
    cleanup();
  });

  const mockInvoice: Invoice = {
    id: 'inv-test-001',
    code: 'HD-20260913-001',
    reportId: 'rep-001',
    patientCode: 'BN-20260913-001',
    patientName: 'NGUYỄN VĂN AN',
    patientDob: '1990',
    patientPhone: '0988776655',
    patientGender: 'Nam',
    doctorName: 'BS. Trần Hoài Long',
    totalAmount: 150000,
    discountPercent: 0,
    discountAmount: 0,
    finalAmount: 150000,
    status: 'Đã thanh toán',
    paymentMethod: 'Tiền mặt',
    createdAt: '2026-09-13T08:30:00.000Z',
    items: [
      {
        code: 'GLU',
        name: 'Glucose máu',
        price: 50000,
        quantity: 1
      },
      {
        code: 'URE',
        name: 'Ure máu',
        price: 50000,
        quantity: 1
      },
      {
        code: 'CRE',
        name: 'Creatinine máu',
        price: 50000,
        quantity: 1
      }
    ]
  };

  it('renders PrintReceiptView with clinic header, itemized breakdown, and totals', () => {
    render(
      <PrintReceiptView
        invoice={mockInvoice}
        clinicInfo={DEFAULT_CLINIC_INFO}
      />
    );

    // Header elements
    expect(screen.getByText('HỆ THỐNG XÉT NGHIỆM GOLAB')).toBeDefined();
    expect(screen.getByText('TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH')).toBeDefined();
    expect(screen.getByText('PHIẾU THU')).toBeDefined();

    // Patient and Items
    expect(screen.getAllByText('NGUYỄN VĂN AN').length).toBeGreaterThan(0);
    expect(screen.getAllByText('HD-20260913-001').length).toBeGreaterThan(0);
    expect(screen.getByText('Glucose máu')).toBeDefined();
    expect(screen.getByText('Ure máu')).toBeDefined();
    expect(screen.getByText('Creatinine máu')).toBeDefined();

    // Final total
    expect(screen.getAllByText(/150\.000/i).length).toBeGreaterThan(0);
  });
});