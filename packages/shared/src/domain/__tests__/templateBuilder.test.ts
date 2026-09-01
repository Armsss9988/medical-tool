import { describe, it, expect } from 'vitest';
import { PRESET_TEMPLATES } from '../templateTypes';

describe('ReportTemplate Domain & Presets', () => {
  it('should include 4 standard preset templates', () => {
    expect(PRESET_TEMPLATES.length).toBe(4);
    const standard = PRESET_TEMPLATES.find((t) => t.id === 'tpl_standard_clinical');
    const allergen = PRESET_TEMPLATES.find((t) => t.id === 'tpl_allergen_specialized');
    const compact = PRESET_TEMPLATES.find((t) => t.id === 'tpl_compact_lab');
    const minimalist = PRESET_TEMPLATES.find((t) => t.id === 'tpl_minimalist');

    expect(standard).toBeDefined();
    expect(standard?.isDefault).toBe(true);
    expect(allergen).toBeDefined();
    expect(compact).toBeDefined();
    expect(minimalist).toBeDefined();
  });

  it('should have properly structured blocks in standard clinical template', () => {
    const standard = PRESET_TEMPLATES[0];
    const blockTypes = standard.blocks.map((b) => b.type);

    expect(blockTypes).toContain('header');
    expect(blockTypes).toContain('title');
    expect(blockTypes).toContain('patient_info');
    expect(blockTypes).toContain('test_table');
    expect(blockTypes).toContain('allergen_patient_summary');
    expect(blockTypes).toContain('allergen_positive_table');
    expect(blockTypes).toContain('signature');
    expect(blockTypes).toContain('allergen_prevention_guide');
  });

  it('should have complete multi-page booklet blocks in allergen specialized template', () => {
    const allergenTpl = PRESET_TEMPLATES.find((t) => t.id === 'tpl_allergen_specialized');
    expect(allergenTpl).toBeDefined();
    const blockTypes = allergenTpl!.blocks.map((b) => b.type);

    // Page 1: Cover
    expect(blockTypes).toContain('header');
    expect(blockTypes).toContain('title');
    expect(blockTypes).toContain('patient_info');
    expect(blockTypes).toContain('test_table');
    expect(blockTypes).toContain('conclusion');
    expect(blockTypes).toContain('signature');

    // Page 2: Summary
    expect(blockTypes).toContain('allergen_header');
    expect(blockTypes).toContain('allergen_title');
    expect(blockTypes).toContain('allergen_patient_summary');
    expect(blockTypes).toContain('allergen_positive_table');
    expect(blockTypes).toContain('allergen_scale_table');
    expect(blockTypes).toContain('allergen_symptoms_box');
    expect(blockTypes).toContain('allergen_tige_note');

    // Page 3: Detail
    expect(blockTypes).toContain('allergen_detail_table');

    // Page 4: Prevention Guide
    expect(blockTypes).toContain('allergen_prevention_guide');
    expect(blockTypes).toContain('page_break');
  });
});

