import { describe, it, expect } from 'vitest';
import { CreateInvoiceUseCase } from '../CreateInvoiceUseCase';
import { Patient, SelectedTest } from '../../domain/types';

describe('CreateInvoiceUseCase', () => {
  const useCase = new CreateInvoiceUseCase();

  const mockPatient: Patient = {
    code: 'BN-001',
    secretToken: 'SEC123',
    name: 'Trần Thị B',
    dob: '15/05/1995',
    gender: 'Nữ',
    phone: '0987654321',
    address: 'Đà Nẵng',
    diagnosis: 'Khám tổng quát'
  };

  const mockTests: SelectedTest[] = [
    {
      category: 'Sinh hóa',
      code: 'GLU',
      name: 'Glucose máu',
      price: 50000,
      refMin: 3.9,
      refMax: 6.4,
      unit: 'mmol/L',
      refText: '',
      result: '5.0',
      note: 'Bình thường'
    },
    {
      category: 'Sinh hóa',
      code: 'CHO',
      name: 'Cholesterol toàn phần',
      price: 60000,
      refMin: 2.8,
      refMax: 5.2,
      unit: 'mmol/L',
      refText: '',
      result: '4.8',
      note: 'Bình thường'
    }
  ];

  it('should create invoice with UNPAID status by default', () => {
    const invoice = useCase.execute({
      patient: mockPatient,
      selectedTests: mockTests,
      discountAmount: 10000,
      surchargeAmount: 5000,
      surchargeNote: 'Phụ thu ngoài giờ',
      paymentMethod: 'Chuyển khoản (VietQR)',
      invoicesCount: 5
    });

    expect(invoice.totalAmount).toBe(110000);
    expect(invoice.surchargeAmount).toBe(5000);
    expect(invoice.discountAmount).toBe(10000);
    expect(invoice.finalAmount).toBe(105000);
    expect(invoice.status).toBe('Chưa thu phí');
    expect(invoice.paidAt).toBeUndefined();
    expect(invoice.paymentMethod).toBe('Chuyển khoản (VietQR)');
    expect(invoice.code).toContain('HD-');
    expect(invoice.code).toContain('006');
  });

  it('should create invoice with PAID status when explicitly specified', () => {
    const invoice = useCase.execute({
      patient: mockPatient,
      selectedTests: mockTests,
      status: 'Đã thanh toán',
      invoicesCount: 0
    });

    expect(invoice.status).toBe('Đã thanh toán');
    expect(invoice.paidAt).toBeDefined();
  });
});
