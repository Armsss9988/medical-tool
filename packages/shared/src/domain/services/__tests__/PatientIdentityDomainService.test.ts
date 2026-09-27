import { describe, it, expect } from 'vitest';
import { PatientIdentityDomainService } from '../PatientIdentityDomainService';
import type { MedicalReport, Patient } from '../../types';

describe('PatientIdentityDomainService', () => {
  it('normalizes Vietnamese names without diacritics and special characters', () => {
    expect(PatientIdentityDomainService.normalizeName('Nguyễn Văn A')).toBe('nguyenvana');
    expect(PatientIdentityDomainService.normalizeName('  Trần Thị Bích Ngọc - 123! ')).toBe('tranthibichngoc123');
  });

  it('normalizes DOB to canonical YYYYMMDD digits across formats', () => {
    expect(PatientIdentityDomainService.normalizeDob('12/05/1990')).toBe('19900512');
    expect(PatientIdentityDomainService.normalizeDob('1990-05-12')).toBe('19900512');
    expect(PatientIdentityDomainService.normalizeDob('1995')).toBe('1995');
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
      patient: { name: 'nguyen van a', dob: '1995' },
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

  it('scanMatch identifies duplicates by explicit code', () => {
    const reports = [
      { id: 'rep-1', code: 'BN01', patient: { name: 'Nguyễn Văn A', code: 'BN01' } }
    ] as unknown as MedicalReport[];

    const result = PatientIdentityDomainService.scanMatch(reports, {
      patient: { name: 'Nguyễn Văn A', code: 'bn01' } as unknown as Patient,
      hasExplicitCode: true
    });

    expect(result.index).toBe(0);
    expect(result.matchedReport?.code).toBe('BN01');
    expect(result.reason).toContain('Trùng Mã BN: [BN01]');
  });

  it('scanMatch identifies duplicates by Identity Triplet (Name + DOB + Gender) when code is empty/auto', () => {
    const reports = [
      {
        id: 'rep-1',
        code: 'BN-2026-001',
        patient: { name: 'Trần Thị Mai', dob: '1990', gender: 'Nữ', code: 'BN-2026-001' }
      }
    ] as unknown as MedicalReport[];

    const result = PatientIdentityDomainService.scanMatch(reports, {
      patient: { name: '  TRẦN THỊ MAI  ', dob: '1990', gender: 'Nữ', code: 'BN-AUTO-888' } as unknown as Patient,
      hasExplicitCode: false
    });

    expect(result.index).toBe(0);
    expect(result.matchedReport?.code).toBe('BN-2026-001');
    expect(result.reason).toContain('Trùng Họ tên & Năm sinh');
  });

  it('scanMatch returns -1 for new distinct patients', () => {
    const reports = [
      {
        id: 'rep-1',
        code: 'BN-2026-001',
        patient: { name: 'Trần Thị Mai', dob: '1990', gender: 'Nữ', code: 'BN-2026-001' }
      }
    ] as unknown as MedicalReport[];

    const result = PatientIdentityDomainService.scanMatch(reports, {
      patient: { name: 'Lê Văn Nam', dob: '1985', gender: 'Nam', code: 'BN-NEW-999' } as unknown as Patient,
      hasExplicitCode: false
    });

    expect(result.index).toBe(-1);
    expect(result.matchedReport).toBeUndefined();
  });
});

