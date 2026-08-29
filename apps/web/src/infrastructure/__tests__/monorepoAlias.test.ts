import { describe, it, expect } from 'vitest';
import { STORAGE_KEYS } from '@domain';
import { DEFAULT_CATALOG } from '@data/defaultCatalog';

describe('monorepo aliases', () => {
  it('@domain resolves into @golab/shared', () => {
    expect(typeof STORAGE_KEYS).toBe('object');
    expect(STORAGE_KEYS.REPORTS).toBeTruthy();
  });

  it('@data resolves into @golab/shared', () => {
    expect(Array.isArray(DEFAULT_CATALOG)).toBe(true);
  });
});