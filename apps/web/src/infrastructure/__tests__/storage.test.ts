// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { saveData, loadData, openDataFolder, getDataDirPath } from '../storage';

describe('storage (web-first localStorage)', () => {
  beforeEach(() => {
    localStorage.clear();
    delete window.electronAPI;
  });

  afterEach(() => {
    localStorage.clear();
    delete window.electronAPI;
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

  it('loadData ignores window.electronAPI even when it is defined', async () => {
    const items = [{ id: '1', name: 'Should round-trip through localStorage' }];
    const electronSpy = vi.fn().mockResolvedValue('FROM_ELECTRON_WRONG_VALUE');
    window.electronAPI = {
      readLocalData: electronSpy,
      writeLocalData: vi.fn(),
      openDataFolder: vi.fn(),
      getDataDirPath: vi.fn(),
    };

    await saveData('catalog', items);
    const loaded = await loadData<typeof items>('catalog', []);

    expect(electronSpy).not.toHaveBeenCalled();
    expect(loaded).toEqual(items);
  });

  it('openDataFolder returns null on web', async () => {
    expect(await openDataFolder()).toBeNull();
  });

  it('getDataDirPath returns a localStorage string on web', async () => {
    expect(await getDataDirPath()).toContain('localStorage');
  });
});
