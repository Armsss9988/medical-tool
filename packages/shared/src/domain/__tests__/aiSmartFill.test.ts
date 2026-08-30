import { describe, it, expect } from 'vitest';
import {
  aiCatalogItemSchema,
  aiBatchPatientSchema,
  aiDoctorSchema,
  aiTestPackageSchema,
  getSystemPromptForTarget,
  MEDICAL_CODE_ALIASES
} from '../index';

describe('AI Smart Fill Domain Schemas & Prompts', () => {
  it('should validate catalog item schema correctly', () => {
    const validItem = {
      code: 'GLU',
      name: 'Glucose máu',
      category: 'Sinh Hóa',
      unit: 'mmol/L',
      evaluationType: 'range' as const,
      refMin: 3.9,
      refMax: 6.4,
      refText: '3.9 - 6.4',
      price: 40000
    };

    const parsed = aiCatalogItemSchema.parse(validItem);
    expect(parsed.code).toBe('GLU');
    expect(parsed.evaluationType).toBe('range');
    expect(parsed.refMin).toBe(3.9);
  });

  it('should validate batch patient schema correctly', () => {
    const validPatient = {
      code: 'BN-001',
      name: 'NGUYEN VAN A',
      dob: '1990',
      gender: 'Nam' as const,
      phone: '0905123456',
      testResults: {
        GLU: '5.4',
        URE: '4.8'
      }
    };

    const parsed = aiBatchPatientSchema.parse(validPatient);
    expect(parsed.name).toBe('NGUYEN VAN A');
    expect(parsed.testResults.GLU).toBe('5.4');
  });

  it('should validate doctor and package schemas', () => {
    const doctor = aiDoctorSchema.parse({
      name: 'BS. Nguyen Thi Thanh Trung',
      specialty: 'Bác sĩ xét nghiệm',
      phone: '0905123456'
    });
    expect(doctor.name).toContain('Nguyen Thi Thanh Trung');

    const pkg = aiTestPackageSchema.parse({
      name: 'Gói Tổng Quát Cơ Bản',
      price: 500000,
      itemCodes: ['GLU', 'URE', 'CRE', 'WBC']
    });
    expect(pkg.itemCodes).toHaveLength(4);
  });

  it('should generate target-specific system prompts', () => {
    const catalogPrompt = getSystemPromptForTarget('CATALOG_ITEMS');
    expect(catalogPrompt).toContain('MẪU CHỈ SỐ XÉT NGHIỆM');

    const patientPrompt = getSystemPromptForTarget('BATCH_PATIENTS');
    expect(patientPrompt).toContain('MẪU KHÁM ĐOÀN');
  });

  it('should have comprehensive medical aliases mapping', () => {
    expect(MEDICAL_CODE_ALIASES['glucose'].code).toBe('GLU');
    expect(MEDICAL_CODE_ALIASES['duong mau'].code).toBe('GLU');
    expect(MEDICAL_CODE_ALIASES['bach cau'].code).toBe('WBC');
    expect(MEDICAL_CODE_ALIASES['creatinin'].code).toBe('CRE');
  });
});
