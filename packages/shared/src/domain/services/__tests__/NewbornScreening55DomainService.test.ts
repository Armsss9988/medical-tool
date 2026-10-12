import { describe, it, expect } from 'vitest';
import {
  evaluateConditionExpression,
  NewbornScreening55DomainService,
  NewbornDiseaseRule,
  MarkerEvaluation
} from '../NewbornScreening55DomainService';

describe('NewbornScreening55DomainService - Rule Engine & Expressions', () => {
  it('đánh giá toán tử so sánh cơ bản > và < trên số thực chính xác', () => {
    const values = { C0: 8.5, C16: 6.5, C3: 4.2 };
    
    expect(evaluateConditionExpression('C0 < 9.0', values)).toEqual({
      result: true,
      breachedMarkers: ['C0'],
      missingMarkers: []
    });

    expect(evaluateConditionExpression('C16 > 6.20', values)).toEqual({
      result: true,
      breachedMarkers: ['C16'],
      missingMarkers: []
    });

    expect(evaluateConditionExpression('C3 > 4.20', values)).toEqual({
      result: false,
      breachedMarkers: [],
      missingMarkers: []
    });
  });

  it('hỗ trợ logic AND, OR, NOT(...) và dấu phẩy thập phân', () => {
    const values = { C16: 6.3, 'C18:1': 1.5, Phe: 150, Tyr: 30 };

    // OR với dấu phẩy thập phân
    const orExpr = evaluateConditionExpression('C16 > 6,20 OR C18:1 > 2,70', values);
    expect(orExpr.result).toBe(true);
    expect(orExpr.breachedMarkers).toContain('C16');

    // AND
    const andExpr = evaluateConditionExpression('Phe > 120 AND Tyr < 50', values);
    expect(andExpr.result).toBe(true);
    expect(andExpr.breachedMarkers).toContain('Phe');
    expect(andExpr.breachedMarkers).toContain('Tyr');

    // NOT(...)
    const notExpr = evaluateConditionExpression('NOT(C18:1 > 2.70)', values);
    expect(notExpr.result).toBe(true);
  });

  it('hỗ trợ toán tử COUNT(cond1, cond2, ...) = N', () => {
    const values = { C3: 5.0, 'C3/C2': 0.35, C16: 5.0 };

    // 2 điều kiện đúng trong COUNT 3 điều kiện
    const countExpr = evaluateConditionExpression('COUNT(C3 > 4.2, C3/C2 > 0.25, C16 > 6.2) = 2', values);
    expect(countExpr.result).toBe(true);
    expect(countExpr.breachedMarkers).toContain('C3');
    expect(countExpr.breachedMarkers).toContain('C3/C2');

    const countExprFail = evaluateConditionExpression('COUNT(C3 > 4.2, C3/C2 > 0.25, C16 > 6.2) = 3', values);
    expect(countExprFail.result).toBe(false);
  });

  it('báo thiếu marker (missingMarkers) và trả về Chưa xác định', () => {
    const values = { C0: 5.0 }; // Thiếu C16 và C18:1
    const res = evaluateConditionExpression('C16 > 6.20 OR C18:1 > 2.70', values);
    expect(res.missingMarkers).toContain('C16');
    expect(res.missingMarkers).toContain('C18:1');
    expect(res.result).toBe(null);
  });
});

describe('NewbornScreening55DomainService - Disease Evaluation & Auto Conclusion', () => {
  const customRules: NewbornDiseaseRule[] = [
    {
      index: 1,
      code: 'SS55_01',
      name: 'Bệnh thiếu Phenylalanine hydroxylase (PKU)',
      expression: 'Phe > 120 AND Phe/Tyr > 2.0',
      defaultWhenFalse: 'Nguy cơ thấp',
      hasAsterisk: false
    },
    {
      index: 2,
      code: 'SS55_02',
      name: 'Bệnh thiếu hụt carnitine palmitoyltransferase IA (*)',
      expression: 'C0 < 9.0',
      defaultWhenFalse: 'Nguy cơ thấp (độ nhạy sàng lọc hạn chế)',
      hasAsterisk: true
    },
    {
      index: 3,
      code: 'SS55_03',
      name: 'Bệnh thiếu carnitine-acylcarnitine translocase',
      expression: 'C16 > 6.20 OR C18:1 > 2.70',
      defaultWhenFalse: 'Nguy cơ thấp',
      hasAsterisk: false
    }
  ];

  const markerEvals: MarkerEvaluation[] = [
    {
      marker: 'Phe',
      name: 'Phenylalanine',
      value: 65.0,
      unit: 'µmol/L',
      refText: '30,0 – 120,0',
      evaluation: 'Trong giới hạn sàng lọc',
      isOutOfRange: false
    },
    {
      marker: 'Tyr',
      name: 'Tyrosine',
      value: 70.0,
      unit: 'µmol/L',
      refText: '25,0 – 180,0',
      evaluation: 'Trong giới hạn sàng lọc',
      isOutOfRange: false
    },
    {
      marker: 'Phe/Tyr',
      name: 'Tỷ lệ Phe/Tyr',
      value: 0.93,
      unit: '',
      refText: '< 2,0',
      evaluation: 'Trong giới hạn sàng lọc',
      isOutOfRange: false
    },
    {
      marker: 'C0',
      name: 'Free Carnitine',
      value: 25.0,
      unit: 'µmol/L',
      refText: '9,0 – 55,0',
      evaluation: 'Trong giới hạn sàng lọc',
      isOutOfRange: false
    },
    {
      marker: 'C16',
      name: 'Palmitoylcarnitine',
      value: 2.1,
      unit: 'µmol/L',
      refText: '< 6,20',
      evaluation: 'Trong giới hạn sàng lọc',
      isOutOfRange: false
    },
    {
      marker: 'C18:1',
      name: 'Oleylcarnitine',
      value: 1.2,
      unit: 'µmol/L',
      refText: '< 2,70',
      evaluation: 'Trong giới hạn sàng lọc',
      isOutOfRange: false
    },
    {
      marker: 'Met',
      name: 'Methionine',
      value: 15.0,
      unit: 'µmol/L',
      refText: '10,0 – 50,0',
      evaluation: 'Trong giới hạn sàng lọc',
      isOutOfRange: false
    },
    {
      marker: 'C2',
      name: 'Acetylcarnitine',
      value: 12.0,
      unit: 'µmol/L',
      refText: '> 8,0',
      evaluation: 'Trong giới hạn sàng lọc',
      isOutOfRange: false
    }
  ];

  it('Trường hợp 1: Mọi marker trong giới hạn -> Kết luận chuẩn bình thường', () => {
    const summary = NewbornScreening55DomainService.evaluateScreening(
      markerEvals,
      customRules
    );

    expect(summary.highRiskDiseases.length).toBe(0);
    expect(summary.diseaseResults.find(d => d.code === 'SS55_02')?.statusText).toBe(
      'Nguy cơ thấp (độ nhạy sàng lọc hạn chế)'
    );
    expect(summary.autoConclusion).toBe(
      'Các chỉ số được báo cáo nằm trong giới hạn sàng lọc theo ngưỡng áp dụng trên phiếu. Kết quả sàng lọc không phải chẩn đoán xác định và không loại trừ hoàn toàn bệnh.'
    );
  });

  it('Trường hợp 2: Có bệnh nguy cơ cao -> Kết luận cảnh báo kèm tên bệnh và marker', () => {
    const modifiedMarkers: MarkerEvaluation[] = markerEvals.map(m => {
      if (m.marker === 'C0') {
        return {
          ...m,
          value: 7.2, // < 9.0 -> thỏa mãn C0 < 9.0
          evaluation: 'Thấp hơn giới hạn sàng lọc ↓',
          isOutOfRange: true
        };
      }
      return m;
    });

    const summary = NewbornScreening55DomainService.evaluateScreening(
      modifiedMarkers,
      customRules
    );

    expect(summary.highRiskDiseases.length).toBe(1);
    expect(summary.highRiskDiseases[0].name).toContain('Bệnh thiếu hụt carnitine palmitoyltransferase IA');
    expect(summary.autoConclusion).toContain('Nguy cơ cao với:');
    expect(summary.autoConclusion).toContain('Bệnh thiếu hụt carnitine palmitoyltransferase IA');
    expect(summary.autoConclusion).toContain('marker: C0');
    expect(summary.autoConclusion).toContain(
      'Đề nghị lấy mẫu lại và/hoặc làm xét nghiệm khẳng định; liên hệ bác sĩ chuyên khoa để được tư vấn.'
    );
  });

  it('Trường hợp 3: Marker ngoài ngưỡng nhưng không ứng với bệnh nào (Met < 10, C2 < 8,0) -> Bổ sung câu nhắc bác sĩ', () => {
    const modifiedMarkers: MarkerEvaluation[] = markerEvals.map(m => {
      if (m.marker === 'Met') {
        return {
          ...m,
          value: 8.0, // < 10.0 -> ngoài ngưỡng
          evaluation: 'Thấp hơn giới hạn sàng lọc ↓',
          isOutOfRange: true
        };
      }
      return m;
    });

    const summary = NewbornScreening55DomainService.evaluateScreening(
      modifiedMarkers,
      customRules
    );

    expect(summary.highRiskDiseases.length).toBe(0);
    expect(summary.outOfRangeMarkersWithoutDisease).toContain('Met');
    expect(summary.autoConclusion).toContain(
      'Các chỉ số được báo cáo nằm trong giới hạn sàng lọc theo ngưỡng áp dụng trên phiếu. Kết quả sàng lọc không phải chẩn đoán xác định và không loại trừ hoàn toàn bệnh.'
    );
    expect(summary.autoConclusion).toContain('Chỉ số ngoài giới hạn sàng lọc cần bác sĩ xem xét: Met.');
  });
});
