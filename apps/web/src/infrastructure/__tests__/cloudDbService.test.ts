// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../apiClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../apiClient')>();
  return {
    ...actual,
    getTable: vi.fn(),
    putTable: vi.fn()
  };
});

import {
  syncTableToCloud,
  syncCatalogToSupabase,
  syncReportsToSupabase,
  syncClinicInfoToSupabase,
  fetchTableFromCloud,
  fetchClinicInfoFromSupabase,
  fetchReportsFromSupabase,
  fetchAllCloudDataToLocal,
  testSupabaseConnection,
  syncAllLocalDataToSupabase
} from '../cloudDbService';
import { getTable, putTable, ApiAuthError } from '../apiClient';
import { CloudDbConfig } from '@domain/types';

const mockGetTable = vi.mocked(getTable);
const mockPutTable = vi.mocked(putTable);

const cfg: CloudDbConfig = {
  enabled: true,
  supabaseUrl: 'https://test-project.supabase.co',
  supabaseAnonKey: 'mock-anon-key',
  autoSync: true
};

beforeEach(() => {
  mockGetTable.mockReset();
  mockPutTable.mockReset();
});

describe('cloudDbService wired to apiClient', () => {
  it('(a) syncCatalogToSupabase calls putTable with mapped table name and the array rows', async () => {
    const catalog = [{ code: 'GLU', name: 'Glucose' }] as never;
    const ok = await syncCatalogToSupabase(catalog, cfg);
    expect(ok).toBe(true);
    expect(mockPutTable).toHaveBeenCalledWith('catalog', catalog);
  });

  it('(b) syncReportsToSupabase sends doc domain objects as-is (API repo wraps { id, data })', async () => {
    const report = { id: 'r1', code: 'BN001' } as never;
    await syncReportsToSupabase([report], cfg);
    expect(mockPutTable).toHaveBeenCalledWith('medical-reports', [report]);
  });

  it('(b2) syncClinicInfoToSupabase sends a single object as a 1-row array', async () => {
    const clinic = { name: 'GoLab', address: '', phone: '', defaultDoctor: '' } as never;
    await syncClinicInfoToSupabase(clinic, cfg);
    expect(mockPutTable).toHaveBeenCalledWith('clinic-info', [clinic]);
  });

  it('(c) fetchTableFromCloud returns the rows array for a normal table', async () => {
    mockGetTable.mockResolvedValue({ rows: ['a', 'b'], count: 2, updatedAt: '' });
    const res = await fetchTableFromCloud('catalog_data', cfg);
    expect(mockGetTable).toHaveBeenCalledWith('catalog');
    expect(res).toEqual(['a', 'b'] as never);
  });

  it('(c2) fetchReportsFromSupabase unwraps doc rows back to domain objects', async () => {
    const report = { id: 'r1', code: 'BN001' } as never;
    mockGetTable.mockResolvedValue({ rows: [{ id: 'r1', data: report }], count: 1, updatedAt: '' });
    const res = await fetchReportsFromSupabase(cfg);
    expect(mockGetTable).toHaveBeenCalledWith('medical-reports');
    expect(res).toEqual([report]);
  });

  it('(d) fetchClinicInfoFromSupabase returns rows[0] of the single-object table', async () => {
    const clinic = { name: 'GoLab', address: '', phone: '', defaultDoctor: '' } as never;
    mockGetTable.mockResolvedValue({ rows: [clinic], count: 1, updatedAt: '' });
    const res = await fetchClinicInfoFromSupabase(cfg);
    expect(mockGetTable).toHaveBeenCalledWith('clinic-info');
    expect(res).toEqual(clinic);
  });

  it('(d2) fetchAllCloudDataToLocal unwraps clinicInfo and zaloConfig as single objects', async () => {
    const clinic = { name: 'GoLab', address: '', phone: '', defaultDoctor: '' } as never;
    const zalo = { enabled: false } as never;
    const refRange = { id: 'ref_glu', name: 'Glucose' } as never;
    const cieLink = { id: 'l1', catalogCode: 'GLU', equipmentId: 'eq_1' } as never;
    const scale = { id: 'scale_1', name: 'Scale 1' } as never;
    mockGetTable
      .mockResolvedValueOnce({ rows: [{ code: 'GLU' }], count: 1, updatedAt: '' }) // catalog
      .mockResolvedValueOnce({ rows: [], count: 0, updatedAt: '' }) // packages
      .mockResolvedValueOnce({ rows: [], count: 0, updatedAt: '' }) // groups
      .mockResolvedValueOnce({ rows: [], count: 0, updatedAt: '' }) // equipments
      .mockResolvedValueOnce({ rows: [], count: 0, updatedAt: '' }) // doctors
      .mockResolvedValueOnce({ rows: [clinic], count: 1, updatedAt: '' }) // clinic
      .mockResolvedValueOnce({ rows: [refRange], count: 1, updatedAt: '' }) // reference_ranges
      .mockResolvedValueOnce({ rows: [cieLink], count: 1, updatedAt: '' }) // catalog_item_equipments
      .mockResolvedValueOnce({ rows: [scale], count: 1, updatedAt: '' }) // allergen_scales
      .mockResolvedValueOnce({ rows: [], count: 0, updatedAt: '' }) // reports
      .mockResolvedValueOnce({ rows: [], count: 0, updatedAt: '' }) // invoices
      .mockResolvedValueOnce({ rows: [zalo], count: 1, updatedAt: '' }); // zalo
    const res = await fetchAllCloudDataToLocal(cfg);
    expect(res?.clinicInfo).toEqual(clinic);
    expect(res?.zaloConfig).toEqual(zalo);
    expect(res?.referenceRanges).toEqual([refRange]);
    expect(res?.catalogItemEquipments).toEqual([cieLink]);
    expect(res?.allergenScales).toEqual([scale]);
  });

  it('(e) config.enabled === false returns false without calling putTable', async () => {
    const disabled = { ...cfg, enabled: false };
    const ok = await syncTableToCloud('catalog_data', [], disabled);
    expect(ok).toBe(false);
    expect(mockPutTable).not.toHaveBeenCalled();
  });

  it('(e2) fetchTableFromCloud returns null when config.enabled === false', async () => {
    const disabled = { ...cfg, enabled: false };
    const res = await fetchTableFromCloud('catalog_data', disabled);
    expect(res).toBeNull();
    expect(mockGetTable).not.toHaveBeenCalled();
  });

  it('testSupabaseConnection succeeds when the API is reachable', async () => {
    mockGetTable.mockResolvedValue({ rows: [], count: 0, updatedAt: '' });
    const res = await testSupabaseConnection(cfg);
    expect(mockGetTable).toHaveBeenCalledWith('catalog');
    expect(res.success).toBe(true);
  });

  it('testSupabaseConnection reports wrong password on ApiAuthError', async () => {
    mockGetTable.mockRejectedValue(new ApiAuthError('unauthorized'));
    const res = await testSupabaseConnection(cfg);
    expect(res.success).toBe(false);
    expect(res.message).toBe('Sai mật khẩu API!');
  });

  it('testSupabaseConnection reports connection failure on other errors', async () => {
    mockGetTable.mockRejectedValue(new Error('network down'));
    const res = await testSupabaseConnection(cfg);
    expect(res.success).toBe(false);
    expect(res.message).toContain('Không thể kết nối API: network down');
  });

  it('syncAllLocalDataToSupabase routes every table through the API', async () => {
    mockPutTable.mockResolvedValue({ replaced: 1 });
    const res = await syncAllLocalDataToSupabase(
      {
        catalog: [{ code: 'GLU', name: 'Glucose' }] as never,
        testPackages: [{ id: 'p1', name: 'P', price: 1, items: [], codes: [] }] as never,
        testGroups: [{ id: 'g1', name: 'G' }] as never,
        equipments: [{ id: 'e1', code: 'EC', name: 'EQ' }] as never,
        doctorsList: [{ id: 'd1', name: 'Dr' }] as never,
        clinicInfo: { name: 'GoLab', address: '', phone: '', defaultDoctor: '' } as never,
        referenceRanges: [{ id: 'ref_glu', name: 'Glucose' }] as never,
        catalogItemEquipments: [{ id: 'l1', catalogCode: 'GLU', equipmentId: 'eq_1' }] as never,
        allergenScales: [{ id: 'scale_1', name: 'Scale 1' }] as never,
        reports: [{ id: 'r1', code: 'BN1' }] as never,
        invoices: [{ id: 'i1', code: 'HD1' }] as never,
        zaloConfig: { enabled: false } as never
      },
      cfg
    );
    expect(res.success).toBe(true);
    expect(mockPutTable).toHaveBeenCalledWith('catalog', expect.anything());
    expect(mockPutTable).toHaveBeenCalledWith('catalog-item-equipments', [{ id: 'l1', catalogCode: 'GLU', equipmentId: 'eq_1' }]);
    expect(mockPutTable).toHaveBeenCalledWith('allergen-scales', [{ id: 'scale_1', name: 'Scale 1' }]);
    expect(mockPutTable).toHaveBeenCalledWith('reference-ranges', [{ id: 'ref_glu', name: 'Glucose' }]);
    expect(mockPutTable).toHaveBeenCalledWith('medical-reports', [{ id: 'r1', code: 'BN1' }]);
    expect(mockPutTable).toHaveBeenCalledWith('clinic-info', [
      { name: 'GoLab', address: '', phone: '', defaultDoctor: '' }
    ]);
  });
});
