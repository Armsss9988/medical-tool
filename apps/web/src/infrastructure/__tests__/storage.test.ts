// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { saveData, loadData, getDataDirPath } from '../storage';

describe('storage (web-first localStorage)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('saveData then loadData round-trips via localStorage', async () => {
    const items = [
      { id: '1', name: 'Test Catalog', qrCodeDataUrl: 'data:image/png;base64,abc' },
    ];
    const saveResult = await saveData('catalog', items);
    expect(saveResult.success).toBe(true);

    const loaded = await loadData<typeof items>('catalog', []);
    expect(loaded).toEqual(items);
  });

  it('getDataDirPath returns a localStorage string on web', async () => {
    expect(await getDataDirPath()).toContain('localStorage');
  });

  it('normalizes keys starting with medical_ without creating medical_medical_ duplicates', async () => {
    // Simulate legacy duplicate
    localStorage.setItem('medical_medical_reports', JSON.stringify([{ id: 'legacy' }]));

    const reports = [{ id: 'rep1', name: 'Blood test' }];
    await saveData('medical_reports', reports);

    // Should be saved under 'medical_reports'
    expect(localStorage.getItem('medical_reports')).toBe(JSON.stringify(reports));
    // Should NOT create or keep 'medical_medical_reports'
    expect(localStorage.getItem('medical_medical_reports')).toBeNull();

    // loadData works with both 'medical_reports' and 'reports'
    const loadedDirect = await loadData('medical_reports', []);
    expect(loadedDirect).toEqual(reports);

    const loadedStripped = await loadData('reports', []);
    expect(loadedStripped).toEqual(reports);
  });
});

