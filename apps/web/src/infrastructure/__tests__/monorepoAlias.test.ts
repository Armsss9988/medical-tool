import { describe, it, expect } from 'vitest';
import { STORAGE_KEYS } from '@domain';
import { autoResolveItemLinks } from '@data';

describe('monorepo aliases', () => {
  it('@domain resolves into @golab/shared', () => {
    expect(typeof STORAGE_KEYS).toBe('object');
    expect(STORAGE_KEYS.REPORTS).toBeTruthy();
  });

  it('@data resolves into @golab/shared', () => {
    expect(typeof autoResolveItemLinks).toBe('function');
  });
});