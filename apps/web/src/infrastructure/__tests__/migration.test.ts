// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../storage', () => ({
  loadData: vi.fn()
}));

vi.mock('../cloudDbService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../cloudDbService')>();
  return {
    ...actual,
    syncAllLocalDataToSupabase: vi.fn()
  };
});

import { migrateLocalToApi } from '../migration';
import { loadData } from '../storage';
import { syncAllLocalDataToSupabase, DEFAULT_CLOUD_DB_CONFIG } from '../cloudDbService';
import { STORAGE_KEYS } from '@domain/constants/storageKeys';

const mockLoadData = vi.mocked(loadData);
const mockSync = vi.mocked(syncAllLocalDataToSupabase);

const SAMPLE = {
  catalog: [{ code: 'GLU', name: 'Glucose' }],
  testPackages: [{ id: 'p1', name: 'P', price: 1, items: [], codes: [] }],
  testGroups: [{ id: 'g1', name: 'G' }],
  equipments: [{ id: 'e1', code: 'EC', name: 'EQ' }],
  doctorsList: [{ id: 'd1', name: 'Dr' }],
  clinicInfo: { name: 'GoLab', address: '', phone: '', defaultDoctor: '' },
  reports: [{ id: 'r1', code: 'BN1' }],
  invoices: [{ id: 'i1', code: 'HD1' }],
  zaloConfig: { enabled: false }
};

beforeEach(() => {
  mockLoadData.mockReset();
  mockSync.mockReset();

  mockLoadData.mockImplementation(async (key: string) => {
    switch (key) {
      case STORAGE_KEYS.CATALOG:
        return SAMPLE.catalog;
      case STORAGE_KEYS.TEST_PACKAGES:
        return SAMPLE.testPackages;
      case STORAGE_KEYS.TEST_GROUPS:
        return SAMPLE.testGroups;
      case STORAGE_KEYS.EQUIPMENTS:
        return SAMPLE.equipments;
      case STORAGE_KEYS.DOCTORS:
        return SAMPLE.doctorsList;
      case STORAGE_KEYS.CLINIC_INFO:
        return SAMPLE.clinicInfo;
      case STORAGE_KEYS.REPORTS:
        return SAMPLE.reports;
      case STORAGE_KEYS.INVOICES:
        return SAMPLE.invoices;
      case STORAGE_KEYS.ZALO_CONFIG:
        return SAMPLE.zaloConfig;
      default:
        return null;
    }
  });

  mockSync.mockResolvedValue({ success: true, message: 'ok', stats: {} });
});

describe('migrateLocalToApi', () => {
  it('loads every store from localStorage and pushes an AllLocalDataPayload to the API', async () => {
    const result = await migrateLocalToApi();

    expect(mockSync).toHaveBeenCalledTimes(1);
    const [payload, config] = mockSync.mock.calls[0];

    expect(config).toBe(DEFAULT_CLOUD_DB_CONFIG);
    expect(payload.catalog).toEqual(SAMPLE.catalog);
    expect(payload.clinicInfo).toEqual(SAMPLE.clinicInfo);
    expect(payload.reports).toEqual(SAMPLE.reports);
    expect(payload.invoices).toEqual(SAMPLE.invoices);
    expect(payload.zaloConfig).toEqual(SAMPLE.zaloConfig);
    expect(result.success).toBe(true);
  });

  it('returns the result from syncAllLocalDataToSupabase unchanged', async () => {
    mockSync.mockResolvedValue({
      success: false,
      message: 'boom',
      stats: { catalog: 0, testPackages: 0, testGroups: 0, equipments: 0, doctorsList: 0, reports: 0, invoices: 0 }
    });

    const result = await migrateLocalToApi();
    expect(result.success).toBe(false);
    expect(result.message).toBe('boom');
  });
});
