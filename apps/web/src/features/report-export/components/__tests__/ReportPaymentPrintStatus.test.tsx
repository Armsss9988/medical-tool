import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import PrintReportView from '../PrintReportView';
import HybridReportView from '../HybridReportView';
import AllergenCoverPage from '../allergenReport/AllergenCoverPage';
import { Patient, SelectedTest, DEFAULT_CLINIC_INFO } from '@domain';
import { LabReportAggregate } from '@domain/aggregates/LabReportAggregate';

describe('Report Payment Print Status - SSOT Payment Display in Printed Reports', () => {
  afterEach(() => {
    cleanup();
  });

  const sampleTests: SelectedTest[] = [
    {
      code: 'GLU',
      name: 'Glucose máu (Đường huyết)',
      category: 'Sinh hóa máu',
      result: '5.2',
      unit: 'mmol/L',
      refMin: 3.9,
      refMax: 6.4,
      refText: '3.9 - 6.4',
      price: 50000,
      note: 'Bình thường'
    }
  ];

  const patientWithPaidAt: Patient = {
    code: 'BN-PAID-01',
    secretToken: 'tok-01',
    name: 'NGUYỄN VĂN AN',
    dob: '1990',
    gender: 'Nam',
    phone: '0988776655',
    address: '123 Trần Phú',
    diagnosis: 'Kiểm tra sức khỏe',
    sampleCode: 'SP-01',
    sampleStatus: 'Đạt',
    orderedAt: '19/09/2026 08:30',
    paidAt: '2026-09-19T09:15:00.000Z',
    receivedAt: '19/09/2026 08:45',
    returnedAt: '19/09/2026 10:15'
  };

  it('1. PrintReportView displays formatted payment date and never shows "Chưa thu phí" when patient.paidAt is present', () => {
    render(
      <PrintReportView
        patient={patientWithPaidAt}
        selectedTests={sampleTests}
        clinicInfo={DEFAULT_CLINIC_INFO}
      />
    );

    // Should display formatted payment date
    expect(screen.getAllByText(/19\/09\/2026/).length).toBeGreaterThan(0);
    // Should NOT contain 'Chưa thu phí'
    expect(screen.queryByText('Chưa thu phí')).toBeNull();
  });

  it('2. LabReportAggregate.updateReport updates invoiceId when passed', () => {
    const agg = LabReportAggregate.create({
      code: 'BN-001',
      doctorName: 'BS. Lê Văn C',
      patient: patientWithPaidAt,
      selectedTests: sampleTests
    });

    expect(agg.invoiceId).toBeUndefined();

    agg.updateReport({
      invoiceId: 'inv-test-123'
    });

    expect(agg.invoiceId).toBe('inv-test-123');
    expect(agg.toSnapshot().invoiceId).toBe('inv-test-123');
  });

  it('3. HybridReportView formats paidAt with formatDisplayDate and does not show "Chưa thu phí"', () => {
    render(
      <HybridReportView
        patient={patientWithPaidAt}
        selectedTests={sampleTests}
        clinicInfo={DEFAULT_CLINIC_INFO}
      />
    );

    expect(screen.getAllByText(/19\/09\/2026/).length).toBeGreaterThan(0);
    expect(screen.queryByText('Chưa thu phí')).toBeNull();
  });

  it('4. AllergenCoverPage formats paidAt with formatDisplayDate and does not show "Chưa thu phí"', () => {
    render(
      <AllergenCoverPage
        patient={patientWithPaidAt}
        currentDateStr="19/09/2026"
        totalCount={1}
        packagePrice={50000}
        totalPages={1}
      />
    );

    expect(screen.getAllByText(/19\/09\/2026/).length).toBeGreaterThan(0);
    expect(screen.queryByText('Chưa thu phí')).toBeNull();
  });
});
