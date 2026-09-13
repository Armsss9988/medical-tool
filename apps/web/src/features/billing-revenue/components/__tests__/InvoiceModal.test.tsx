// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InvoiceModal from '../InvoiceModal';
import { ToastProvider } from '../../../../contexts/ToastContext';
import { Patient, SelectedTest, ClinicInfo } from '@domain/types';

vi.mock('../PrintReceiptView', () => ({
  default: () => React.createElement('div', { 'data-testid': 'mock-print-receipt' }, 'Print Receipt')
}));

vi.mock('@infra/pdfService', () => ({
  generateHighQualityPdf: vi.fn().mockResolvedValue({ base64: 'mock-base64' }),
  downloadPdfDirectly: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('@infra/cloudService', () => ({
  uploadPdfToCloudinary: vi.fn().mockResolvedValue({ url: 'https://cloud.example.com/inv.pdf' })
}));

describe('InvoiceModal - Logic, State & Behavior with @testing-library/user-event', () => {
  const mockPatient: Patient = {
    code: 'BN-2026-001',
    name: 'NGUYỄN VĂN AN',
    dob: '1985',
    gender: 'Nam',
    phone: '0988776655',
    address: '123 Phố Huế, Hà Nội',
    diagnosis: '',
    secretToken: 'token-123',
    doctor: 'BS. Trần Hoài Long'
  };

  const mockSelectedTests: SelectedTest[] = [
    {
      code: 'GLU',
      name: 'Glucose máu',
      category: 'Sinh Hóa',
      unit: 'mmol/L',
      refMin: 3.9,
      refMax: 6.4,
      refText: '3.9 - 6.4',
      price: 50000,
      result: '5.2',
      note: ''
    },
    {
      code: 'URE',
      name: 'Ure máu',
      category: 'Sinh Hóa',
      unit: 'mmol/L',
      refMin: 2.5,
      refMax: 7.5,
      refText: '2.5 - 7.5',
      price: 50000,
      result: '4.8',
      note: ''
    }
  ];

  const mockClinicInfo: ClinicInfo = {
    name: 'PHÒNG XÉT NGHIỆM GOLAB',
    address: 'Hà Nội',
    phone: '0988776655',
    bankId: 'ICB',
    bankName: 'VietinBank',
    bankAccountNo: '10123456789',
    bankAccountName: 'LE PHAN ANH',
    cashierName: 'Lê Phan Anh',
    defaultDoctor: 'BS. Trần Hoài Long',
    bankQrImageUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('1. BEHAVIOUR & DISPLAY: Renders patient identity, test items table, and calculated subtotal (100.000 đ)', () => {
    render(
      <ToastProvider>
        <InvoiceModal
          isOpen={true}
          onClose={vi.fn()}
          patient={mockPatient}
          selectedTests={mockSelectedTests}
          clinicInfo={mockClinicInfo}
          currentReportId="rep-001"
          onSaveInvoice={vi.fn()}
        />
      </ToastProvider>
    );

    // Patient info is displayed
    expect(screen.getByText('NGUYỄN VĂN AN')).toBeTruthy();
    expect(screen.getByText('BN-2026-001')).toBeTruthy();

    // Test items are listed as editable input values
    expect(screen.getByDisplayValue('Glucose máu')).toBeTruthy();
    expect(screen.getByDisplayValue('Ure máu')).toBeTruthy();

    // Formatted sum (50k + 50k = 100.000 đ) appears in the modal
    const prices = screen.getAllByText('100.000 đ');
    expect(prices.length).toBeGreaterThan(0);
  });

  it('2. BEHAVIOUR & STATE: Switching payment methods toggles VietQR Napas panel visibility', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <InvoiceModal
          isOpen={true}
          onClose={vi.fn()}
          patient={mockPatient}
          selectedTests={mockSelectedTests}
          clinicInfo={mockClinicInfo}
          currentReportId="rep-001"
          onSaveInvoice={vi.fn()}
        />
      </ToastProvider>
    );

    // Default payment method is VietQR transfer, so VietQR instructions exist
    expect(screen.getByText(/Quét Mã VietQR Napas 247/i)).toBeTruthy();

    // User clicks 'Tiền mặt' payment method button
    const cashButton = screen.getByRole('button', { name: /Tiền mặt/i });
    await user.click(cashButton);

    // VietQR Napas panel should be hidden
    expect(screen.queryByText(/Quét Mã VietQR Napas 247/i)).toBeNull();

    // User clicks 'Chuyển khoản (VietQR)' back
    const qrButton = screen.getByRole('button', { name: /Chuyển khoản/i });
    await user.click(qrButton);

    // VietQR Napas panel reappears
    expect(screen.getByText(/Quét Mã VietQR Napas 247/i)).toBeTruthy();
  });

  it('3. LOGIC & BEHAVIOUR: Entering discount value updates total dynamically', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <InvoiceModal
          isOpen={true}
          onClose={vi.fn()}
          patient={mockPatient}
          selectedTests={mockSelectedTests}
          clinicInfo={mockClinicInfo}
          currentReportId="rep-001"
          onSaveInvoice={vi.fn()}
        />
      </ToastProvider>
    );

    // Find discount input (% discount by default with placeholder '0')
    const discountInput = screen.getByPlaceholderText('0');
    expect(discountInput).toBeTruthy();

    // User types '10' for 10% discount
    await user.type(discountInput, '10');

    // 10% of 100.000 đ = 10.000 đ discount -> Final = 90.000 đ
    expect(screen.getAllByText('90.000 đ').length).toBeGreaterThan(0);
  });

  it('4. BEHAVIOUR & WORKFLOW: Clicking "Xác Nhận Đã Thu Tiền" saves invoice with PAID status', async () => {
    const user = userEvent.setup();
    const handleSaveInvoice = vi.fn();
    const handleClose = vi.fn();

    render(
      <ToastProvider>
        <InvoiceModal
          isOpen={true}
          onClose={handleClose}
          patient={mockPatient}
          selectedTests={mockSelectedTests}
          clinicInfo={mockClinicInfo}
          currentReportId="rep-001"
          onSaveInvoice={handleSaveInvoice}
        />
      </ToastProvider>
    );

    // Click confirm payment button
    const confirmButton = screen.getByRole('button', { name: /Xác Nhận Đã Thu Tiền/i });
    await user.click(confirmButton);

    // Assert onSaveInvoice was invoked
    expect(handleSaveInvoice).toHaveBeenCalledTimes(1);
    const savedInvoice = handleSaveInvoice.mock.calls[0][0];

    expect(savedInvoice.status).toBe('Đã thanh toán');
    expect(savedInvoice.reportId).toBe('rep-001');
    expect(savedInvoice.finalAmount).toBe(100000);
    expect(savedInvoice.paidAt).toBeDefined();

    // Assert onClose was called
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
