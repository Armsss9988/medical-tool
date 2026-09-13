// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTemplateManager } from '../useTemplateManager';
import { TemplateProvider } from '../../../../contexts/TemplateContext';
import { PRESET_TEMPLATES } from '@domain/templateTypes';

vi.mock('@infra/cloudDbService', () => ({
  fetchReportTemplatesFromSupabase: vi.fn().mockResolvedValue([])
}));

vi.mock('@infra/apiClient', () => ({
  putReportTemplatesApi: vi.fn().mockResolvedValue({ success: true })
}));

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(TemplateProvider, null, children);

describe('useTemplateManager (Bug 25 & Bug 8)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('1. Loads default presets when localStorage is empty', () => {
    const { result } = renderHook(() => useTemplateManager(), { wrapper });
    expect(result.current.templates.length).toBe(PRESET_TEMPLATES.length);
    expect(result.current.templates[0].id).toBe(PRESET_TEMPLATES[0].id);
  });

  it('2. Bug 25: Preserves user customizations to preset templates from localStorage', () => {
    const modifiedStandard = {
      ...PRESET_TEMPLATES[0],
      name: 'Mẫu Tùy Chỉnh Của Bác Sĩ Tuấn',
      primaryColor: '#ff0000'
    };

    localStorage.setItem('golab_report_templates_v2', JSON.stringify([modifiedStandard]));

    const { result } = renderHook(() => useTemplateManager(), { wrapper });
    const loadedStandard = result.current.templates.find((t) => t.id === PRESET_TEMPLATES[0].id);

    expect(loadedStandard).toBeDefined();
    expect(loadedStandard?.name).toBe('Mẫu Tùy Chỉnh Của Bác Sĩ Tuấn');
    expect(loadedStandard?.primaryColor).toBe('#ff0000');
  });

  it('3. Retains completely new user templates alongside presets', () => {
    const customTemplate = {
      ...PRESET_TEMPLATES[0],
      id: 'tpl_user_custom_999',
      name: 'Custom User Template'
    };

    localStorage.setItem('golab_report_templates_v2', JSON.stringify([customTemplate]));

    const { result } = renderHook(() => useTemplateManager(), { wrapper });
    expect(result.current.templates.some((t) => t.id === 'tpl_user_custom_999')).toBe(true);
    expect(result.current.templates.length).toBe(PRESET_TEMPLATES.length + 1);
  });

  it('4. Bug 8: Deleting a preset persists in storage and does not resurrect on reload', () => {
    const { result, unmount } = renderHook(() => useTemplateManager(), { wrapper });
    const targetPresetId = PRESET_TEMPLATES[0].id;

    act(() => {
      result.current.deleteTemplate(targetPresetId);
    });

    expect(result.current.templates.some((t) => t.id === targetPresetId)).toBe(false);
    unmount();

    // Re-mount the hook with provider (simulate page reload)
    const { result: reloadedResult } = renderHook(() => useTemplateManager(), { wrapper });
    expect(reloadedResult.current.templates.some((t) => t.id === targetPresetId)).toBe(false);
  });
});
