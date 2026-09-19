import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { DynamicReportPatientInfoBlock } from '../DynamicReportPatientInfoBlock';
import { Patient, TemplateBlock } from '@domain';

describe('DynamicReportPatientInfoBlock Payment Display', () => {
  afterEach(() => {
    cleanup();
  });

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
    paidAt: '2026-09-19T10:00:00Z'
  };

  it('formats paidAt with formatDisplayDate and does not show "Chưa thu phí"', () => {
    const block: TemplateBlock = {
      id: 'info-1',
      type: 'patient_info',
      title: 'Thông tin bệnh nhân',
      visible: true,
      order: 1,
      props: {
        layout: 'table_12_fields',
        highlightName: true,
        highlightSampleCode: true,
        showSampleStatus: true,
        showDoctor: true,
        showReceivedAt: true,
        showReturnedAt: true
      }
    };

    render(
      <DynamicReportPatientInfoBlock
        block={block}
        patient={patientWithPaidAt}
      />
    );

    expect(screen.getAllByText(/19\/09\/2026/).length).toBeGreaterThan(0);
    expect(screen.queryByText('Chưa thu phí')).toBeNull();
  });
});
