import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import NewbornScreening55ReportView from '../components/NewbornScreening55ReportView';
import {
  formatReferenceRange,
  formatMSMSEvaluationText,
  evaluateTestIndicator,
  cleanGarbage14And15,
  resolveIndicatorReference,
  sanitizeCatalogAndEquipments,
  STANDARD_BETA_HCG_SCALE,
  isAllergenCategory,
  NewbornScreening55DomainService
} from '@domain';
import type {
  CatalogItem,
  CatalogItemEquipmentLink,
  AllergenGradingScale,
  TestEquipment,
  MarkerEvaluation
} from '@domain';

describe('Kiểm thử chấp nhận theo Mục 6 - GOLAB CauLenh KyThuat SuaPhanMem 2026-10-10', () => {
  // Tiêu chí 1: Xuất phiếu bất kỳ: không còn ký tự ≤ ≥ <= >= =< =>
  it('Tiêu chí 1: Xuất phiếu bất kỳ không còn ký tự ≤, ≥, <=, >=, =<, =>', () => {
    const mockPatient = {
      code: 'BN-20261008-004',
      name: 'TRẦN GIA HƯNG',
      dob: '2026-10-05',
      gender: 'Nam',
      phone: '0988776655',
      address: 'Thành phố Đồng Hới, Quảng Bình',
      sampleStatus: 'Đạt',
      samplingDate: '2026-10-08',
      receiveDate: '2026-10-08',
      resultDate: '2026-10-09',
      weight: '3200',
      sampleSender: 'BV Hữu Nghị Việt Nam - Cu Ba'
    };

    const mockClinicInfo = {
      name: 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH',
      address: 'Đồng Hới, Quảng Bình',
      hotline: '032.855.3773',
      website: 'golab.com.vn'
    };

    const mockTests = [
      { code: 'SS_C0', name: 'Free Carnitine (C0)', value: '25.0', unit: 'µmol/L', refText: '9,0 – 55,0', refMin: 9.0, refMax: 55.0 },
      { code: 'SS_C2', name: 'Acetylcarnitine (C2)', value: '16.8', unit: 'µmol/L', refText: '> 8,0', refMin: 8.0, refMax: null },
      { code: 'SS_C3', name: 'Propionylcarnitine (C3)', value: '4.20', unit: 'µmol/L', refText: '< 4,20', refMin: 0, refMax: 4.2 },
      { code: 'SS55_01', name: 'Bệnh thiếu Phenylalanine hydroxylase (PKU)', value: 'Nguy cơ thấp', unit: '', refText: 'Phe > 120 AND Phe/Tyr > 2.0' },
      { code: 'SS55_28', name: 'Bệnh Methylmalonic acidemia (Cbl A, B)', value: 'Nguy cơ thấp', unit: '', refText: 'C3 > 4.20 AND C3/C2 > 0.25' }
    ];

    const { container } = render(
      <NewbornScreening55ReportView
        patient={mockPatient}
        clinicInfo={mockClinicInfo}
        selectedTests={mockTests}
      />
    );

    const fullRenderedText = container.textContent || '';
    expect(fullRenderedText).not.toMatch(/[≤≥]|<=|>=|=<|=>/);
  });

  // Tiêu chí 2: C3 Max 4,20, Min 0 → in < 4,20; KQ 4,20 → Trong giới hạn sàng lọc; KQ 4,21 → Cao hơn giới hạn sàng lọc ↑
  it('Tiêu chí 2: C3 Max 4,20, Min 0 in < 4,20; KQ 4,20 Trong giới hạn, KQ 4,21 Cao hơn giới hạn ↑', () => {
    const refText = formatReferenceRange(0, 4.2, undefined, 2);
    expect(refText).toBe('< 4,20');

    const evalAtBoundary = formatMSMSEvaluationText(4.20, 0, 4.2);
    expect(evalAtBoundary).toBe('Trong giới hạn sàng lọc');

    const evalAboveBoundary = formatMSMSEvaluationText(4.21, 0, 4.2);
    expect(evalAboveBoundary).toBe('Cao hơn giới hạn sàng lọc ↑');
  });

  // Tiêu chí 3: C2 chỉ có Min 8,0 → in > 8,0; KQ 16,8 → trong giới hạn
  it('Tiêu chí 3: C2 chỉ có Min 8,0 in > 8,0; KQ 16,8 trong giới hạn sàng lọc', () => {
    const refText = formatReferenceRange(8.0, null, undefined, 1);
    expect(refText).toBe('> 8,0');

    const evalWithin = formatMSMSEvaluationText(16.8, 8.0, null);
    expect(evalWithin).toBe('Trong giới hạn sàng lọc');
  });

  // Tiêu chí 4: Upload lại file GoLab_SLSS55_ChuanPhieu_1/2/3: đơn vị 4 tỷ lệ để trống; 55 dòng bệnh không còn "14 - 14" / "15 - 15"
  it('Tiêu chí 4: Dọn dữ liệu rác 14/15: đơn vị 4 tỷ lệ để trống, 55 dòng bệnh không còn "14 - 14" / "15 - 15"', () => {
    const dirtyItems: CatalogItem[] = [
      { code: 'SS_RATIO1', name: 'Tỷ lệ C3/C2', category: 'Sàng lọc sơ sinh', price: 0, evaluationType: 'range', unit: '14', refMin: 0, refMax: 0.25, refText: '< 0,25' },
      {
        code: 'SS55_01',
        name: 'Bệnh thiếu Phenylalanine hydroxylase (PKU)',
        category: 'Sàng lọc sơ sinh',
        price: 0,
        scientific: 'Phe > 120 AND Phe/Tyr > 2.0',
        evaluationType: 'range',
        unit: '15',
        refMin: 14,
        refMax: 15,
        refText: '14 - 14'
      }
    ];

    const cleaned = cleanGarbage14And15(dirtyItems);
    const cleanedRatio = cleaned.catalog.find((c) => c.code === 'SS_RATIO1');
    const cleanedDisease = cleaned.catalog.find((c) => c.code === 'SS55_01');

    expect(cleanedRatio?.unit).toBe('');
    expect(cleanedDisease?.unit).toBe('');
    expect(cleanedDisease?.refMin).toBeNull();
    expect(cleanedDisease?.refMax).toBeNull();
    expect(cleanedDisease?.refText).not.toContain('14');
    expect(cleanedDisease?.refText).toBe('Phe > 120 AND Phe/Tyr > 2.0');

    // Kiểm tra resolveIndicatorReference cũng làm sạch
    const resolved = resolveIndicatorReference(dirtyItems[1]);
    expect(resolved.evaluationType).toBe('text');
    expect(resolved.unit).toBe('');
    expect(resolved.refMin).toBeNull();
    expect(resolved.refMax).toBeNull();
    expect(resolved.refText).toBe('Phe > 120 AND Phe/Tyr > 2,0');
  });

  // Tiêu chí 5: Beta-hCG theo thang Beta-hCG (mIU/mL): KQ 1,0 → Âm tính; KQ 12 → Vùng xám; KQ 75,51 → Dương tính, tham chiếu < 5
  it('Tiêu chí 5: Đánh giá Beta-hCG theo thang chuẩn (KQ 1,0: Âm tính, KQ 12: Vùng xám, KQ 75,51: Dương tính, ref < 5)', () => {
    const evalNeg = evaluateTestIndicator('BHCG', 'Miễn dịch', 'mIU/mL', '1,0', null, null, STANDARD_BETA_HCG_SCALE, undefined, 'scale');
    expect(evalNeg.status).toBe('normal');
    expect(evalNeg.label).toBe('Âm tính');
    expect(evalNeg.isAbnormal).toBe(false);

    const evalGrey = evaluateTestIndicator('BHCG', 'Miễn dịch', 'mIU/mL', '12', null, null, STANDARD_BETA_HCG_SCALE, undefined, 'scale');
    expect(evalGrey.status).toBe('high');
    expect(evalGrey.label).toBe('Vùng xám');
    expect(evalGrey.isAbnormal).toBe(true);

    const evalPos = evaluateTestIndicator('BHCG', 'Miễn dịch', 'mIU/mL', '75,51', null, null, STANDARD_BETA_HCG_SCALE, undefined, 'scale');
    expect(evalPos.status).toBe('high');
    expect(evalPos.label).toBe('Dương tính');
    expect(evalPos.isAbnormal).toBe(true);

    const refText = STANDARD_BETA_HCG_SCALE.levels[0]?.rangeText || '';
    expect(refText).toBe('< 5');

    // Chặn chỉ số không thuộc Dị Nguyên dùng thang dị nguyên
    expect(isAllergenCategory('Miễn dịch')).toBe(false);
    expect(isAllergenCategory('Dị Nguyên')).toBe(true);
  });

  // Tiêu chí 6: Toàn bộ KQ phiếu mẫu BN-20261008-004 tự sinh kết luận chuẩn
  it('Tiêu chí 6: BN-20261008-004 tự sinh kết luận an toàn khi mọi marker trong giới hạn', () => {
    const markerEvals: MarkerEvaluation[] = [
      { marker: 'C0', name: 'Free Carnitine (C0)', value: 25.0, unit: 'µmol/L', refText: '9,0 – 55,0', evaluation: 'Trong giới hạn sàng lọc', isOutOfRange: false },
      { marker: 'C2', name: 'Acetylcarnitine (C2)', value: 16.8, unit: 'µmol/L', refText: '> 8,0', evaluation: 'Trong giới hạn sàng lọc', isOutOfRange: false },
      { marker: 'C3', name: 'Propionylcarnitine (C3)', value: 4.20, unit: 'µmol/L', refText: '< 4,20', evaluation: 'Trong giới hạn sàng lọc', isOutOfRange: false },
      { marker: 'Phe', name: 'Phenylalanine (Phe)', value: 55.0, unit: 'µmol/L', refText: '25,0 – 120,0', evaluation: 'Trong giới hạn sàng lọc', isOutOfRange: false },
      { marker: 'Tyr', name: 'Tyrosine (Tyr)', value: 60.0, unit: 'µmol/L', refText: '30,0 – 250,0', evaluation: 'Trong giới hạn sàng lọc', isOutOfRange: false }
    ];

    const evaluation = NewbornScreening55DomainService.evaluateScreening(markerEvals);
    expect(evaluation.highRiskDiseases.length).toBe(0);
    expect(evaluation.autoConclusion).toContain('Các chỉ số được báo cáo nằm trong giới hạn sàng lọc theo ngưỡng áp dụng trên phiếu');
    expect(evaluation.autoConclusion).not.toMatch(/[≤≥]|<=|>=|=<|=>/);
  });

  // Tiêu chí 7: Mã HPDADAY chỉ còn 1 cấu hình mặc định là "Máy đo hơi thở Urea C14 (H. pylori)"
  it('Tiêu chí 7: HPDADAY chỉ còn đúng 1 cấu hình máy mặc định là "Máy đo hơi thở Urea C14 (H. pylori)"', () => {
    const rawCatalog: CatalogItem[] = [
      { code: 'HPDADAY', name: 'Test vi khuẩn HP hơi thở C14', category: 'Thăm dò chức năng', price: 400000, evaluationType: 'range', unit: 'DPM', refText: '< 50' }
    ];

    const rawEquipments: TestEquipment[] = [
      { id: 'eq_c14_main', name: 'Máy đo hơi thở Urea C14 (H. pylori)' },
      { id: 'eq_garbage_1', name: 'f3ba2e15-7764-4e4b-b0b3-96b02ca43058' },
      { id: 'eq_garbage_2', name: 'eq_eq_urea_c14' }
    ];

    const rawLinks: CatalogItemEquipmentLink[] = [
      { id: 'l1', catalogCode: 'HPDADAY', equipmentId: 'eq_garbage_1', isDefault: true },
      { id: 'l2', catalogCode: 'HPDADAY', equipmentId: 'eq_garbage_2', isDefault: false },
      { id: 'l3', catalogCode: 'HPDADAY', equipmentId: 'eq_c14_main', isDefault: false }
    ];

    const rawScales: AllergenGradingScale[] = [];

    // Signature: (catalog, links, scales, equipments)
    const result = sanitizeCatalogAndEquipments(rawCatalog, rawLinks, rawScales, rawEquipments);
    const hpLinks = result.links.filter((l) => l.catalogCode === 'HPDADAY');

    expect(hpLinks.length).toBe(1);
    expect(hpLinks[0].equipmentId).toBe('eq_c14_main');
    expect(hpLinks[0].isDefault).toBe(true);

    const defaultEquip = rawEquipments.find((e) => e.id === hpLinks[0].equipmentId);
    expect(defaultEquip?.name).toBe('Máy đo hơi thở Urea C14 (H. pylori)');
  });
});
