import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import AllergenSummaryPage from '../allergenReport/AllergenSummaryPage';
import { Patient, AllergenGradingScale } from '@domain/types';

describe('AllergenSummaryPage - Dynamic Scale Title Tests', () => {
  afterEach(() => {
    cleanup();
  });

  const mockPatient: Patient = {
    code: 'BN-TEST-001',
    secretToken: 'tok-001',
    name: 'NGUYỄN VĂN AN',
    dob: '1990',
    gender: 'Nam',
    phone: '0912345678',
    address: 'Đồng Hới, Quảng Bình',
    diagnosis: 'Xét nghiệm dị ứng',
    sampleStatus: 'Đạt'
  };

  const mockScale: AllergenGradingScale = {
    id: 'scale_protia_91',
    name: 'DIỄN GIẢI ĐỘ DƯƠNG TÍNH (PROTIA 91)',
    equipment: 'Máy PROTIA Allergy-Q Smart và Q-processor',
    unit: 'IU/ml',
    levels: [
      { grade: 0, minVal: 0, maxVal: 0.34, rangeText: '<0.34', label: 'Không phản ứng', isPositive: false, colorKey: 'white' },
      { grade: 1, minVal: 0.35, maxVal: 0.69, rangeText: '0.35 - 0.69', label: 'Yếu', isPositive: true, colorKey: 'amber-light' }
    ]
  };

  it('renders DIỄN GIẢI ĐỘ DƯƠNG TÍNH without package name for individual indicators (chỉ số lẻ)', () => {
    render(
      <AllergenSummaryPage
        patient={mockPatient}
        currentLogo=""
        positiveList={[]}
        appliedScales={[mockScale]}
        // Không truyền packageName (hoặc undefined) -> ca chỉ số lẻ
      />
    );

    // Tiêu đề bảng thang đo phải là 'DIỄN GIẢI ĐỘ DƯƠNG TÍNH', không kèm tên gói hay (PROTIA 91)
    expect(screen.getByText('DIỄN GIẢI ĐỘ DƯƠNG TÍNH')).toBeDefined();
    expect(screen.queryByText(/PROTIA 91/i)).toBeNull();
  });

  it('renders DIỄN GIẢI ĐỘ DƯƠNG TÍNH + Tên Gói when packageName is provided', () => {
    render(
      <AllergenSummaryPage
        patient={mockPatient}
        currentLogo=""
        positiveList={[]}
        appliedScales={[mockScale]}
        packageName="Gói 44 Dị Nguyên MEDIWISS"
      />
    );

    expect(screen.getByText('DIỄN GIẢI ĐỘ DƯƠNG TÍNH (Gói 44 Dị Nguyên MEDIWISS)')).toBeDefined();
  });

  it('renders DIỄN GIẢI ĐỘ DƯƠNG TÍNH with Panel 107 package name', () => {
    render(
      <AllergenSummaryPage
        patient={mockPatient}
        currentLogo=""
        positiveList={[]}
        appliedScales={[mockScale]}
        packageName="Panel 107 Dị Nguyên Chuyên Sâu"
      />
    );

    expect(screen.getByText('DIỄN GIẢI ĐỘ DƯƠNG TÍNH (Panel 107 Dị Nguyên Chuyên Sâu)')).toBeDefined();
  });
});
