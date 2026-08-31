import { describe, it, expect } from 'vitest';
import { resolveIndicatorReference } from '../itemResolver';
import { CatalogItem, CatalogItemEquipmentLink, ReferenceRangeItem, AllergenGradingScale, TestEquipment } from '../../types';

describe('Unified Reference Resolver (resolveIndicatorReference)', () => {
  const mockEquipments: TestEquipment[] = [
    { id: 'eq_ms360', name: 'Máy Sinh Hóa Tự Động MS-360', code: 'MS-360' },
    { id: 'eq_protia', name: 'Máy Đo Dị Nguyên PROTIA Allergy-Q', code: 'PROTIA' },
    { id: 'eq_mediwiss', name: 'Máy MEDIWISS AlleisaScreen 44', code: 'MEDIWISS' }
  ];

  const mockScales: AllergenGradingScale[] = [
    {
      id: 'scale_protia_91',
      name: 'PROTIA 91',
      unit: 'IU/ml',
      levels: [
        { grade: 0, minVal: 0, maxVal: 0.34, rangeText: '<0.34', label: 'Không phản ứng', isPositive: false },
        { grade: 1, minVal: 0.35, maxVal: 0.69, rangeText: '0.35 - 0.69', label: 'Yếu', isPositive: true },
        { grade: 2, minVal: 0.70, maxVal: 3.49, rangeText: '0.70 - 3.49', label: 'Trung bình', isPositive: true }
      ]
    },
    {
      id: 'scale_allergen_44',
      name: 'MEDIWISS 44',
      unit: 'IU/ml',
      levels: [
        { grade: 0, minVal: 0, maxVal: 0.34, rangeText: '<0.35', label: 'Không phản ứng', isPositive: false },
        { grade: 1, minVal: 0.35, maxVal: 0.69, rangeText: '0.35 - 0.69', label: 'Yếu', isPositive: true }
      ]
    }
  ];

  const mockReferenceRanges: ReferenceRangeItem[] = [
    {
      id: 'ref_glucose',
      name: 'Glucose máu',
      refMin: 3.9,
      refMax: 6.4,
      unit: 'mmol/L',
      refText: '3.9 - 6.4'
    },
    {
      id: 'ref_zn',
      name: 'Kẽm huyết thanh',
      refMin: 11.0,
      refMax: 18.0,
      unit: 'µmol/L',
      refText: '11.0 - 18.0'
    }
  ];

  const mockEquipmentLinks: CatalogItemEquipmentLink[] = [
    {
      id: 'link_zn_ms360',
      catalogCode: 'ZN',
      equipmentId: 'eq_ms360',
      refMin: 9.2,
      refMax: 18.4,
      unit: 'µmol/L',
      refText: '9.2 - 18.4',
      isDefault: true
    },
    {
      id: 'link_d1_protia',
      catalogCode: 'd1',
      equipmentId: 'eq_protia',
      scaleId: 'scale_protia_91',
      isDefault: true
    },
    {
      id: 'link_d1_mediwiss',
      catalogCode: 'd1',
      equipmentId: 'eq_mediwiss',
      scaleId: 'scale_allergen_44',
      isDefault: false
    }
  ];

  it('phân giải chính xác chỉ số có cấu hình thiết bị đo riêng (ZN với máy MS-360 -> 9.2 - 18.4 thay vì bảng tĩnh 11 - 18)', () => {
    const item: CatalogItem = {
      code: 'ZN',
      name: 'Kẽm Zinc',
      category: 'Vi Chất',
      unit: 'µmol/L',
      refText: '9.2 - 18.4'
    };

    const resolved = resolveIndicatorReference(item, {
      catalogItemEquipments: mockEquipmentLinks,
      referenceRanges: mockReferenceRanges,
      equipments: mockEquipments
    });

    expect(resolved.refMin).toBe(9.2);
    expect(resolved.refMax).toBe(18.4);
    expect(resolved.refText).toBe('9.2 - 18.4');
    expect(resolved.unit).toBe('µmol/L');
    expect(resolved.evaluationType).toBe('range');
    expect(resolved.equipmentId).toBe('eq_ms360');
    expect(resolved.equipmentName).toBe('Máy Sinh Hóa Tự Động MS-360');
    expect(resolved.isAllergen).toBe(false);
  });

  it('phân giải chính xác chỉ số dị nguyên qua allergen_scales -> trích xuất level có grade 0', () => {
    const item: CatalogItem = {
      code: 'd1',
      name: 'Mạt bụi nhà D.Pteronyssinus',
      category: 'Dị Nguyên',
      unit: 'IU/mL',
      refText: '< 0.34 (Độ 0)'
    };

    const resolved = resolveIndicatorReference(item, {
      catalogItemEquipments: mockEquipmentLinks,
      allergenScales: mockScales,
      equipments: mockEquipments
    });

    expect(resolved.refMin).toBe(0);
    expect(resolved.refMax).toBe(0.34);
    expect(resolved.refText).toBe('<0.34 (Độ 0)');
    expect(resolved.unit).toBe('IU/ml');
    expect(resolved.evaluationType).toBe('scale');
    expect(resolved.scaleId).toBe('scale_protia_91');
    expect(resolved.label).toBe('Không phản ứng');
    expect(resolved.isAllergen).toBe(true);
  });

  it('chuyển đổi máy đo khác nhau cho cùng một dị nguyên (PROTIA -> MEDIWISS 44)', () => {
    const item: CatalogItem = {
      code: 'd1',
      name: 'Mạt bụi nhà D.Pteronyssinus',
      category: 'Dị Nguyên',
      unit: 'IU/mL',
      refText: ''
    };

    const resolved = resolveIndicatorReference(item, {
      equipmentId: 'eq_mediwiss',
      catalogItemEquipments: mockEquipmentLinks,
      allergenScales: mockScales,
      equipments: mockEquipments
    });

    expect(resolved.scaleId).toBe('scale_allergen_44');
    expect(resolved.refText).toBe('<0.35 (Độ 0)');
    expect(resolved.equipmentName).toBe('Máy MEDIWISS AlleisaScreen 44');
  });

  it('phân giải fallback từ ReferenceRangeItem khi chưa có cấu hình thiết bị riêng (GLU)', () => {
    const item: CatalogItem = {
      code: 'GLU',
      name: 'Glucose máu',
      category: 'Sinh Hóa',
      unit: 'mmol/L',
      refText: ''
    };

    const resolved = resolveIndicatorReference(item, {
      referenceRanges: mockReferenceRanges
    });

    expect(resolved.refMin).toBe(3.9);
    expect(resolved.refMax).toBe(6.4);
    expect(resolved.refText).toBe('3.9 - 6.4');
    expect(resolved.unit).toBe('mmol/L');
    expect(resolved.evaluationType).toBe('range');
  });
});
