import { describe, it, expect } from 'vitest';
import { PatientIdentityDomainService } from '../PatientIdentityDomainService';
import type { MedicalReport } from '../../types';

describe('PatientIdentityDomainService', () => {
  it('normalizes Vietnamese names without diacritics and special characters', () => {
    expect(PatientIdentityDomainService.normalizeName('Nguyễn Văn A')).toBe('nguyenvana');
    expect(PatientIdentityDomainService.normalizeName('  Trần Thị Bích Ngọc - 123! ')).toBe('tranthibichngoc123');
  });

  it('normalizes DOB to numeric digits', () => {
    expect(PatientIdentityDomainService.normalizeDob('12/05/1990')).toBe('12051990');
    expect(PatientIdentityDomainService.normalizeDob('1990-05-12')).toBe('19900512');
    expect(PatientIdentityDomainService.normalizeDob('')).toBe('');
    expect(PatientIdentityDomainService.normalizeDob(undefined)).toBe('');
  });

  it('finds report matching by exact ID first', () => {
    const reports = [
      { id: 'rep-1', code: 'BN01', patient: { name: 'A', code: 'BN01' } },
      { id: 'rep-2', code: 'BN02', patient: { name: 'B', code: 'BN02' } }
    ] as unknown as MedicalReport[];

    const index = PatientIdentityDomainService.findMatchingIndex(reports, { id: 'rep-2' });
    expect(index).toBe(1);
  });

  it('finds report matching by explicit patient code', () => {
    const reports = [
      { id: 'rep-1', code: 'BN01', patient: { name: 'Nguyen Van A', code: 'BN01' } }
    ] as unknown as MedicalReport[];

    const index = PatientIdentityDomainService.findMatchingIndex(reports, {
      code: 'BN01',
      hasExplicitCode: true
    });
    expect(index).toBe(0);
  });

  it('finds report matching by name and DOB when allowIdentityMerge is true', () => {
    const reports = [
      {
        id: 'rep-1',
        code: 'BN01',
        patient: { name: 'Nguyễn Văn A', dob: '1995', code: 'BN01' }
      }
    ] as unknown as MedicalReport[];

    const index = PatientIdentityDomainService.findMatchingIndex(reports, {
      patient: { name: 'nguyen van a', dob: '1995' } as any,
      allowIdentityMerge: true
    });
    expect(index).toBe(0);
  });

  it('returns -1 when no criteria match', () => {
    const reports = [
      { id: 'rep-1', code: 'BN01', patient: { name: 'Nguyen Van A', code: 'BN01' } }
    ] as unknown as MedicalReport[];

    const index = PatientIdentityDomainService.findMatchingIndex(reports, {
      code: 'BN99',
      hasExplicitCode: true
    });
    expect(index).toBe(-1);
  });
});
