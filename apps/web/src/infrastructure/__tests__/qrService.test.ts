// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getPortalBaseUrl, buildPortalUrl } from '../qrService';

describe('qrService - Dynamic Portal URL Resolution (Bug 20)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_PORTAL_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('1. Uses custom clinic website when explicitly specified and not default golab.com.vn', () => {
    expect(getPortalBaseUrl('phongkhamtamduc.vn')).toBe('https://phongkhamtamduc.vn');
    expect(getPortalBaseUrl('https://phongkham247.com/')).toBe('https://phongkham247.com');
  });

  it('2. When customWebsite is default golab.com.vn, prioritizes NEXT_PUBLIC_PORTAL_URL if set', () => {
    process.env.NEXT_PUBLIC_PORTAL_URL = 'https://portal.myclinic.vn';
    expect(getPortalBaseUrl('golab.com.vn')).toBe('https://portal.myclinic.vn');
    expect(getPortalBaseUrl('https://golab.com.vn/')).toBe('https://portal.myclinic.vn');
  });

  it('3. When customWebsite is default golab.com.vn, prioritizes NEXT_PUBLIC_APP_URL if set', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://golab-staging.vercel.app';
    expect(getPortalBaseUrl('golab.com.vn')).toBe('https://golab-staging.vercel.app');
  });

  it('4. Uses window.location.origin in browser when on custom domain and no env set', () => {
    delete process.env.NEXT_PUBLIC_PORTAL_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;

    vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      hostname: 'clinic.med.vn',
      origin: 'https://clinic.med.vn'
    } as unknown as Location);

    expect(getPortalBaseUrl('golab.com.vn')).toBe('https://clinic.med.vn');
  });

  it('5. Builds correct portal lookup URL', () => {
    const url = buildPortalUrl('BN-2026-001', 'https://tamduc.com');
    expect(url).toBe('https://tamduc.com/portal?code=BN-2026-001');
  });
});
