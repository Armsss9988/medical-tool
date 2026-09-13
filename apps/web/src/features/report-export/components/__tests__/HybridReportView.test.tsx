import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import HybridReportView from '../HybridReportView';
import { Patient, SelectedTest } from '@domain/types';

describe('HybridReportView - Hybrid Medical PDF Report Tests', () => {
  afterEach(() => {
    cleanup();
  });

  const mockPatient: Patient = {
    code: 'BN-HYBRID-002',
    secretToken: 'tok-hybrid-002',
    name: 'TRẦN THỊ BÍCH HẠNH',
    dob: '1995',
    gender: 'Nữ',
    phone: '0912345678',
    address: 'Số 45 Quang Trung, TP. Đồng Hới, Quảng Bình',
    diagnosis: 'Kiểm tra chức năng gan thận',
    doctor: 'BS. Trần Hoài Long',
    orderedAt: '13/09/2026 09:00',
    receivedAt: '13/09/2026 09:15',
    returnedAt: '13/09/2026 10:45',
    sampleStatus: 'Đạt'
  };

  const mockTests: SelectedTest[] = [
    {
      code: 'AST',
      name: 'AST (GOT)',
      category: 'Men gan',
      result: '25.0',
      unit: 'U/L',
      refMin: 0,
      refMax: 37,
      refText: '< 37',
      price: 45000,
      note: 'Bình thường'
    },
    {
      code: 'ALT',
      name: 'ALT (GPT)',
      category: 'Men gan',
      result: '22.0',
      unit: 'U/L',
      refMin: 0,
      refMax: 41,
      refText: '< 41',
      price: 45000,
      note: 'Bình thường'
    }
  ];

  it('renders Hybrid report with full branded header matching template standards', () => {
    render(
      <HybridReportView
        patient={mockPatient}
        selectedTests={mockTests}
        conclusion="Chức năng gan trong giới hạn bình thường."
      />
    );

    // Header elements
    expect(screen.getByText('Vì sức khỏe người Việt')).toBeDefined();
    expect(screen.getAllByText('HỆ THỐNG XÉT NGHIỆM GOLAB').length).toBeGreaterThan(0);
    expect(screen.getByText('69 CHI NHÁNH TRÊN TOÀN QUỐC')).toBeDefined();
    expect(screen.getAllByText('TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH').length).toBeGreaterThan(0);
    expect(screen.getByText(/Chi nhánh\/điểm tiếp nhận:/i)).toBeDefined();
    expect(screen.getByText(/Trụ sở chính hệ thống:/i)).toBeDefined();
    expect(screen.getAllByText(/Website:/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Hotline:/i).length).toBeGreaterThan(0);
    expect(screen.getByText('QR Tra Cứu')).toBeDefined();
    expect(screen.getByText('kết quả xét nghiệm')).toBeDefined();

    // Body elements
    expect(screen.getAllByText('TRẦN THỊ BÍCH HẠNH').length).toBeGreaterThan(0);
    expect(screen.getAllByText('BN-HYBRID-002').length).toBeGreaterThan(0);
    expect(screen.getByText('AST (GOT)')).toBeDefined();
    expect(screen.getByText('ALT (GPT)')).toBeDefined();
    expect(screen.getByText(/Chức năng gan trong giới hạn bình thường/i)).toBeDefined();
  });
});
