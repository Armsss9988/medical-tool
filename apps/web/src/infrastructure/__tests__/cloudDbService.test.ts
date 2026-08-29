import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  syncAllLocalDataToSupabase,
  restoreAllDataToSupabase,
  AllLocalDataPayload
} from '../cloudDbService';
import { CloudDbConfig } from '@domain/types';

describe('Cloud DB Service - Sync & Migration Suite', () => {
  const mockConfig: CloudDbConfig = {
    enabled: true,
    supabaseUrl: 'https://test-project.supabase.co',
    supabaseAnonKey: 'mock-anon-key',
    autoSync: true
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return error when Cloud DB is disabled or url is missing', async () => {
    const disabledConfig: CloudDbConfig = {
      enabled: false,
      supabaseUrl: '',
      supabaseAnonKey: '',
      autoSync: false
    };

    const res = await syncAllLocalDataToSupabase({
      catalog: [],
      testPackages: [],
      testGroups: [],
      equipments: [],
      doctorsList: [],
      clinicInfo: null,
      reports: [],
      invoices: []
    }, disabledConfig);

    expect(res.success).toBe(false);
    expect(res.message).toContain('Chưa bật');
  });

  it('should sync all 9 tables to Supabase and return accurate statistics', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async () => {
      return {
        ok: true,
        status: 200,
        json: async () => [{ key: 'mock' }]
      } as Response;
    });

    const payload: AllLocalDataPayload = {
      catalog: [{ code: 'GLU', name: 'Glucose', price: 50000, category: 'Sinh hóa', refMin: 3.9, refMax: 6.4, unit: 'mmol/L', refText: '3.9 - 6.4' }],
      testPackages: [{ id: 'pkg1', name: 'Gói Cơ Bản', price: 200000, codes: ['GLU'] }],
      testGroups: [{ id: 'grp1', name: 'Sinh hóa máu' }],
      equipments: [{ id: 'eq1', code: 'BS200', name: 'Mindray BS-200' }],
      doctorsList: [{ id: 'doc1', name: 'BS. Lê Phan Anh' }],
      clinicInfo: { name: 'GoLab', address: 'Quảng Trị', phone: '032.855.3773', defaultDoctor: 'BS. Lê Phan Anh' },
      reports: [{
        id: 'rep1',
        code: 'BN001',
        sampleCode: 'BN001',
        createdAt: '2026-08-29T10:00:00.000Z',
        updatedAt: '2026-08-29T10:00:00.000Z',
        patient: {
          code: 'BN001',
          name: 'Nguyễn Văn A',
          dob: '1990-01-01',
          gender: 'Nam',
          phone: '0901234567',
          address: 'Hà Nội',
          diagnosis: 'Khám sức khỏe',
          secretToken: 'abc'
        },
        doctorName: 'BS. Lê Phan Anh',
        selectedTests: [],
        conclusion: 'Bình thường',
        isAllergen: false,
        status: 'Chờ xét nghiệm',
        testCount: 0
      }],
      invoices: [{
        id: 'inv1',
        code: 'HD001',
        createdAt: '2026-08-29T10:00:00.000Z',
        patientName: 'Nguyễn Văn A',
        patientDob: '1990-01-01',
        patientPhone: '0901234567',
        patientGender: 'Nam',
        doctorName: 'BS. Lê Phan Anh',
        items: [],
        totalAmount: 50000,
        discountPercent: 0,
        finalAmount: 50000,
        paymentMethod: 'Tiền mặt',
        status: 'Chưa thu phí'
      }],
      zaloConfig: {
        enabled: true,
        oaId: '123',
        appId: 'app1',
        secretKey: 'sec1',
        accessToken: 'token1',
        templateId: 'tpl1',
        autoSendOnExport: false
      }
    };

    const res = await syncAllLocalDataToSupabase(payload, mockConfig);

    expect(res.success).toBe(true);
    expect(res.stats.catalog).toBe(1);
    expect(res.stats.testPackages).toBe(1);
    expect(res.stats.reports).toBe(1);
    expect(res.stats.invoices).toBe(1);
    expect(res.stats.doctorsList).toBe(1);
    expect(fetchSpy).toHaveBeenCalled();
  });

  it('should restore all data from valid backup JSON', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async () => {
      return {
        ok: true,
        status: 200,
        json: async () => [{ key: 'catalog_data' }]
      } as Response;
    });

    const backupJson = JSON.stringify({
      _meta: {
        backup_at: new Date().toISOString(),
        supabase_url: 'https://test-project.supabase.co',
        version: '2.0',
        tables: ['catalog_data']
      },
      catalog_data: [{ id: '1', code: 'GLU', name: 'Glucose' }],
      medical_reports: [{ id: 'rep1', code: 'BN001' }],
      invoices_data: [{ id: 'inv1' }]
    });

    const res = await restoreAllDataToSupabase(backupJson, mockConfig);
    expect(res.success).toBe(true);
    expect(res.message).toContain('Restore thành công');
  });

  it('should reject invalid backup JSON gracefully', async () => {
    const invalidJson = '{"invalid": true}';
    const res = await restoreAllDataToSupabase(invalidJson, mockConfig);
    expect(res.success).toBe(false);
    expect(res.message).toContain('không hợp lệ');
  });
});
