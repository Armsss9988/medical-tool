/**
 * NewbornScreening55DomainService.ts
 * Pure Domain Service: Động cơ đánh giá 55 bệnh sơ sinh (MS/MS) & Sinh kết luận tự động.
 * Tuân thủ quy chuẩn DDD Core: Không import React, DOM API hay thư viện ngoài.
 */

export type NewbornDiseaseRiskStatus =
  | 'HIGH_RISK'
  | 'LOW_RISK'
  | 'LOW_RISK_LIMITED'
  | 'UNDETERMINED';

export interface NewbornDiseaseRule {
  readonly index: number;
  readonly code: string;
  readonly name: string;
  readonly expression: string; // e.g. "C0 < 9.0", "C16 > 6.20 OR C18:1 > 2.70", "COUNT(...) = 2"
  readonly defaultWhenFalse: 'Nguy cơ thấp' | 'Nguy cơ thấp (độ nhạy sàng lọc hạn chế)';
  readonly hasAsterisk: boolean;
}

export interface DiseaseEvaluationResult {
  readonly index: number;
  readonly code: string;
  readonly name: string;
  readonly status: NewbornDiseaseRiskStatus;
  readonly statusText: string;
  readonly breachedMarkers: string[];
  readonly expression: string;
}

export interface MarkerEvaluation {
  readonly marker: string;
  readonly name: string;
  readonly value: number | null;
  readonly unit: string;
  readonly refText: string;
  readonly evaluation:
    | 'Trong giới hạn sàng lọc'
    | 'Cao hơn giới hạn sàng lọc ↑'
    | 'Thấp hơn giới hạn sàng lọc ↓'
    | 'Chưa xác định';
  readonly isOutOfRange: boolean;
  readonly decimalPlaces?: number | null;
}

export interface NewbornScreeningEvaluationSummary {
  readonly markerEvaluations: MarkerEvaluation[];
  readonly diseaseResults: DiseaseEvaluationResult[];
  readonly highRiskDiseases: DiseaseEvaluationResult[];
  readonly breachedMarkers: string[];
  readonly outOfRangeMarkersWithoutDisease: string[];
  readonly autoConclusion: string;
}

export interface ExpressionEvalOutput {
  readonly result: boolean | null; // null nếu thiếu marker
  readonly breachedMarkers: string[];
  readonly missingMarkers: string[];
}

/**
 * Chuẩn hóa tên marker thành key tra cứu không phân biệt hoa thường và tiền tố SS_
 */
export function normalizeMarkerKey(key: string): string {
  const clean = key.trim().toUpperCase();
  if (clean.startsWith('SS_')) {
    return clean.slice(3);
  }
  return clean;
}

/**
 * Đánh giá một phép so sánh đơn lẻ (ví dụ "C0 < 9.0" hoặc "C16 > 6,20")
 */
function evaluateAtomicComparison(
  expr: string,
  values: Record<string, number | null>
): ExpressionEvalOutput {
  const match = expr.trim().match(/^([A-Za-z0-9_:/]+)\s*([><]=?|==|=)\s*([0-9]+(?:[.,][0-9]+)?)$/);
  if (!match) {
    return { result: null, breachedMarkers: [], missingMarkers: [] };
  }

  const rawIdent = match[1];
  const op = match[2];
  const numStr = match[3].replace(',', '.');
  const targetVal = parseFloat(numStr);

  const normIdent = normalizeMarkerKey(rawIdent);
  const val = values[normIdent];

  if (val === undefined || val === null || isNaN(val)) {
    return { result: null, breachedMarkers: [], missingMarkers: [rawIdent] };
  }

  let isTrue = false;
  if (op === '>' && val > targetVal) isTrue = true;
  else if (op === '>=' && val >= targetVal) isTrue = true;
  else if (op === '<' && val < targetVal) isTrue = true;
  else if (op === '<=' && val <= targetVal) isTrue = true;
  else if ((op === '==' || op === '=') && val === targetVal) isTrue = true;

  return {
    result: isTrue,
    breachedMarkers: isTrue ? [rawIdent] : [],
    missingMarkers: []
  };
}

/**
 * Bộ phân tích và đánh giá biểu thức logic cho 55 bệnh sơ sinh:
 * Hỗ trợ: >, <, >=, <=, AND, OR, NOT(...), COUNT(...) = N
 */
export function evaluateConditionExpression(
  expression: string,
  rawValues: Record<string, number | null>
): ExpressionEvalOutput {
  if (!expression || expression.trim() === '') {
    return { result: false, breachedMarkers: [], missingMarkers: [] };
  }

  // Chuẩn hóa từ điển tra cứu
  const values: Record<string, number | null> = {};
  for (const [k, v] of Object.entries(rawValues)) {
    values[normalizeMarkerKey(k)] = v;
  }

  const trimmed = expression.trim();

  // 1. Kiểm tra COUNT(cond1, cond2, ...) = N hoặc >= N
  const countMatch = trimmed.match(/^COUNT\((.+)\)\s*([><]=?|==|=)\s*(\d+)$/i);
  if (countMatch) {
    const innerConds = countMatch[1].split(',').map(s => s.trim());
    const compOp = countMatch[2];
    const targetCount = parseInt(countMatch[3], 10);

    let trueCount = 0;
    const breachedMarkers: string[] = [];
    const missingMarkers: string[] = [];

    for (const sub of innerConds) {
      const subRes = evaluateConditionExpression(sub, rawValues);
      if (subRes.result === null) {
        missingMarkers.push(...subRes.missingMarkers);
      } else if (subRes.result) {
        trueCount++;
        breachedMarkers.push(...subRes.breachedMarkers);
      }
    }

    if (missingMarkers.length > 0 && trueCount < targetCount) {
      // Có thể thiếu dữ liệu ảnh hưởng kết quả
      return { result: null, breachedMarkers, missingMarkers: Array.from(new Set(missingMarkers)) };
    }

    let countSatisfied = false;
    if (compOp === '=' || compOp === '==') countSatisfied = trueCount === targetCount;
    else if (compOp === '>=') countSatisfied = trueCount >= targetCount;
    else if (compOp === '>') countSatisfied = trueCount > targetCount;
    else if (compOp === '<=') countSatisfied = trueCount <= targetCount;
    else if (compOp === '<') countSatisfied = trueCount < targetCount;

    return {
      result: countSatisfied,
      breachedMarkers: countSatisfied ? Array.from(new Set(breachedMarkers)) : [],
      missingMarkers: Array.from(new Set(missingMarkers))
    };
  }

  // 2. Xử lý NOT(...)
  const notMatch = trimmed.match(/^NOT\((.+)\)$/i);
  if (notMatch) {
    const inner = evaluateConditionExpression(notMatch[1], rawValues);
    if (inner.result === null) {
      return inner;
    }
    return {
      result: !inner.result,
      breachedMarkers: [],
      missingMarkers: inner.missingMarkers
    };
  }

  // 3. Xử lý OR (phân tách cấp cao nhất)
  if (trimmed.includes(' OR ') || trimmed.includes(' or ')) {
    const parts = trimmed.split(/\s+OR\s+/i);
    let anyTrue = false;
    const breachedMarkers: string[] = [];
    const missingMarkers: string[] = [];

    for (const part of parts) {
      const subRes = evaluateConditionExpression(part, rawValues);
      if (subRes.result === true) {
        anyTrue = true;
        breachedMarkers.push(...subRes.breachedMarkers);
      } else if (subRes.result === null) {
        missingMarkers.push(...subRes.missingMarkers);
      }
    }

    if (anyTrue) {
      return {
        result: true,
        breachedMarkers: Array.from(new Set(breachedMarkers)),
        missingMarkers: []
      };
    }
    if (missingMarkers.length > 0) {
      return {
        result: null,
        breachedMarkers: [],
        missingMarkers: Array.from(new Set(missingMarkers))
      };
    }
    return { result: false, breachedMarkers: [], missingMarkers: [] };
  }

  // 4. Xử lý AND
  if (trimmed.includes(' AND ') || trimmed.includes(' and ')) {
    const parts = trimmed.split(/\s+AND\s+/i);
    let allTrue = true;
    const breachedMarkers: string[] = [];
    const missingMarkers: string[] = [];

    for (const part of parts) {
      const subRes = evaluateConditionExpression(part, rawValues);
      if (subRes.result === null) {
        allTrue = false;
        missingMarkers.push(...subRes.missingMarkers);
      } else if (!subRes.result) {
        allTrue = false;
      } else {
        breachedMarkers.push(...subRes.breachedMarkers);
      }
    }

    if (missingMarkers.length > 0) {
      return {
        result: null,
        breachedMarkers: [],
        missingMarkers: Array.from(new Set(missingMarkers))
      };
    }

    return {
      result: allTrue,
      breachedMarkers: allTrue ? Array.from(new Set(breachedMarkers)) : [],
      missingMarkers: []
    };
  }

  // 5. Biểu thức so sánh nguyên tử
  return evaluateAtomicComparison(trimmed, values);
}

/**
 * Danh sách 55 bệnh sơ sinh mặc định chuẩn y khoa theo quy định GoLab
 */
export const DEFAULT_55_DISEASE_RULES: readonly NewbornDiseaseRule[] = [
  { index: 1, code: 'SS55_01', name: 'Bệnh thiếu Phenylalanine hydroxylase (PKU)', expression: 'Phe > 120 AND Phe/Tyr > 2.0', defaultWhenFalse: 'Nguy cơ thấp', hasAsterisk: false },
  { index: 2, code: 'SS55_02', name: 'Bệnh tăng Phenylalanine máu không điển hình', expression: 'Phe > 120 AND Phe/Tyr < 2.0', defaultWhenFalse: 'Nguy cơ thấp', hasAsterisk: false },
  { index: 3, code: 'SS55_03', name: 'Bệnh siro niệu (MSUD)', expression: 'Leu > 250 OR Val > 250', defaultWhenFalse: 'Nguy cơ thấp', hasAsterisk: false },
  { index: 4, code: 'SS55_04', name: 'Bệnh Homocystin niệu', expression: 'Met > 50', defaultWhenFalse: 'Nguy cơ thấp', hasAsterisk: false },
  { index: 5, code: 'SS55_05', name: 'Bệnh Tyrosin máu type I', expression: 'Tyr > 180', defaultWhenFalse: 'Nguy cơ thấp', hasAsterisk: false },
  { index: 6, code: 'SS55_06', name: 'Bệnh Tyrosin máu type II (*)', expression: 'Tyr > 200', defaultWhenFalse: 'Nguy cơ thấp (độ nhạy sàng lọc hạn chế)', hasAsterisk: true },
  { index: 7, code: 'SS55_07', name: 'Bệnh Tyrosin máu type III (*)', expression: 'Tyr > 180 AND Phe < 120', defaultWhenFalse: 'Nguy cơ thấp (độ nhạy sàng lọc hạn chế)', hasAsterisk: true },
  { index: 8, code: 'SS55_08', name: 'Bệnh tăng Citrullin máu type I', expression: 'Cit > 50', defaultWhenFalse: 'Nguy cơ thấp', hasAsterisk: false },
  { index: 9, code: 'SS55_09', name: 'Bệnh tăng Citrullin máu type II (Citrin)', expression: 'Cit > 50 AND Met > 50', defaultWhenFalse: 'Nguy cơ thấp', hasAsterisk: false },
  { index: 10, code: 'SS55_10', name: 'Bệnh Argininosuccinic acid niệu (ASA)', expression: 'Cit > 50 AND ASA > 0.5', defaultWhenFalse: 'Nguy cơ thấp', hasAsterisk: false },
  { index: 11, code: 'SS55_11', name: 'Bệnh tăng Arginine máu', expression: 'Arg > 50', defaultWhenFalse: 'Nguy cơ thấp', hasAsterisk: false },
  { index: 12, code: 'SS55_12', name: 'Bệnh thiếu hụt Carnitine Palmitoyltransferase IA (*)', expression: 'C0 < 9.0', defaultWhenFalse: 'Nguy cơ thấp (độ nhạy sàng lọc hạn chế)', hasAsterisk: true },
  { index: 13, code: 'SS55_13', name: 'Bệnh thiếu hụt Carnitine-Acylcarnitine Translocase', expression: 'C16 > 6.20 OR C18:1 > 2.70', defaultWhenFalse: 'Nguy cơ thấp', hasAsterisk: false },
  { index: 14, code: 'SS55_14', name: 'Bệnh thiếu hụt Carnitine Palmitoyltransferase II', expression: 'C16 > 6.20 OR C18 > 1.80', defaultWhenFalse: 'Nguy cơ thấp', hasAsterisk: false },
  { index: 15, code: 'SS55_15', name: 'Bệnh thiếu VLCAD (Very Long-Chain Acyl-CoA DH)', expression: 'C14:1 > 0.40 OR C14 > 0.60', defaultWhenFalse: 'Nguy cơ thấp', hasAsterisk: false },
  { index: 16, code: 'SS55_16', name: 'Bệnh thiếu LCHAD (Long-Chain 3-Hydroxyacyl-CoA DH)', expression: 'C16-OH > 0.10 OR C18:1-OH > 0.08', defaultWhenFalse: 'Nguy cơ thấp', hasAsterisk: false },
  { index: 17, code: 'SS55_17', name: 'Bệnh thiếu Protein ba chức năng ti thể (TFP)', expression: 'C16-OH > 0.10 OR C18-OH > 0.08', defaultWhenFalse: 'Nguy cơ thấp', hasAsterisk: false },
  { index: 18, code: 'SS55_18', name: 'Bệnh thiếu MCAD (Medium-Chain Acyl-CoA DH)', expression: 'C8 > 0.30 OR C8/C10 > 1.5', defaultWhenFalse: 'Nguy cơ thấp', hasAsterisk: false },
  { index: 19, code: 'SS55_19', name: 'Bệnh thiếu SCAD (Short-Chain Acyl-CoA DH)', expression: 'C4 > 1.0', defaultWhenFalse: 'Nguy cơ thấp', hasAsterisk: false },
  { index: 20, code: 'SS55_20', name: 'Bệnh thiếu Isovaleryl-CoA DH (IVA)', expression: 'C5 > 0.50', defaultWhenFalse: 'Nguy cơ thấp', hasAsterisk: false },
  { index: 21, code: 'SS55_21', name: 'Bệnh Glutaric acidemia type I (GA-I)', expression: 'C5DC > 0.20', defaultWhenFalse: 'Nguy cơ thấp', hasAsterisk: false },
  { index: 22, code: 'SS55_22', name: 'Bệnh Glutaric acidemia type II (MADD) (*)', expression: 'C4 > 1.0 AND C5 > 0.50', defaultWhenFalse: 'Nguy cơ thấp (độ nhạy sàng lọc hạn chế)', hasAsterisk: true },
  { index: 23, code: 'SS55_23', name: 'Bệnh thiếu 3-MCC (3-Methylcrotonyl-CoA Carboxylase)', expression: 'C5-OH > 0.60', defaultWhenFalse: 'Nguy cơ thấp', hasAsterisk: false },
  { index: 24, code: 'SS55_24', name: 'Bệnh thiếu 3-HMG-CoA Lyase', expression: 'C5-OH > 0.60 AND C6DC > 0.15', defaultWhenFalse: 'Nguy cơ thấp', hasAsterisk: false },
  { index: 25, code: 'SS55_25', name: 'Bệnh thiếu Beta-Ketothiolase (BKT)', expression: 'C5:1 > 0.15 OR C5-OH > 0.60', defaultWhenFalse: 'Nguy cơ thấp', hasAsterisk: false },
  { index: 26, code: 'SS55_26', name: 'Bệnh Propionic acidemia (PA)', expression: 'C3 > 4.20 AND C3/C2 > 0.25', defaultWhenFalse: 'Nguy cơ thấp', hasAsterisk: false },
  { index: 27, code: 'SS55_27', name: 'Bệnh Methylmalonic acidemia (MMA - mutase)', expression: 'C3 > 4.20 AND C3/C2 > 0.25', defaultWhenFalse: 'Nguy cơ thấp', hasAsterisk: false },
  { index: 28, code: 'SS55_28', name: 'Bệnh Methylmalonic acidemia (Cbl A, B)', expression: 'C3 > 4.20 AND C3/C2 > 0.25', defaultWhenFalse: 'Nguy cơ thấp', hasAsterisk: false },
  // Danh sách bệnh 29 - 55
  { index: 29, code: 'SS55_29', name: 'Bệnh Methylmalonic acidemia kèm Homocystin niệu (Cbl C, D)', expression: 'C3 > 4.20 AND Met < 10', defaultWhenFalse: 'Nguy cơ thấp', hasAsterisk: false },
  { index: 30, code: 'SS55_30', name: 'Bệnh thiếu Malonyl-CoA decarboxylase (*)', expression: 'C3DC > 0.15', defaultWhenFalse: 'Nguy cơ thấp (độ nhạy sàng lọc hạn chế)', hasAsterisk: true },
  { index: 31, code: 'SS55_31', name: 'Bệnh thiếu Isobutyryl-CoA DH (*)', expression: 'C4 > 1.0', defaultWhenFalse: 'Nguy cơ thấp (độ nhạy sàng lọc hạn chế)', hasAsterisk: true },
  { index: 32, code: 'SS55_32', name: 'Bệnh thiếu 2-Methylbutyryl-CoA DH (*)', expression: 'C5 > 0.50', defaultWhenFalse: 'Nguy cơ thấp (độ nhạy sàng lọc hạn chế)', hasAsterisk: true },
  { index: 33, code: 'SS55_33', name: 'Bệnh thiếu 3-Methylglutaconic aciduria type I (*)', expression: 'C5-OH > 0.60', defaultWhenFalse: 'Nguy cơ thấp (độ nhạy sàng lọc hạn chế)', hasAsterisk: true },
  { index: 34, code: 'SS55_34', name: 'Bệnh thiếu 2-Methyl-3-hydroxybutyryl-CoA DH (*)', expression: 'C5-OH > 0.60', defaultWhenFalse: 'Nguy cơ thấp (độ nhạy sàng lọc hạn chế)', hasAsterisk: true },
  { index: 35, code: 'SS55_35', name: 'Bệnh Carnitine uptake defect (CUD)', expression: 'C0 < 9.0', defaultWhenFalse: 'Nguy cơ thấp', hasAsterisk: false },
  { index: 36, code: 'SS55_36', name: 'Bệnh thiếu MCKAT (Medium-Chain Ketoacyl-CoA Thiolase) (*)', expression: 'C10 > 0.35', defaultWhenFalse: 'Nguy cơ thấp (độ nhạy sàng lọc hạn chế)', hasAsterisk: true },
  { index: 37, code: 'SS55_37', name: 'Bệnh thiếu SCHAD (Short-Chain L-3-Hydroxyacyl-CoA DH) (*)', expression: 'C4-OH > 0.20', defaultWhenFalse: 'Nguy cơ thấp (độ nhạy sàng lọc hạn chế)', hasAsterisk: true },
  { index: 38, code: 'SS55_38', name: 'Bệnh thiếu Dienoyl-CoA reductase (*)', expression: 'C10:2 > 0.15', defaultWhenFalse: 'Nguy cơ thấp (độ nhạy sàng lọc hạn chế)', hasAsterisk: true },
  { index: 39, code: 'SS55_39', name: 'Bệnh thiếu Carnitine palmitoyltransferase II thể sơ sinh', expression: 'C16 > 6.20 AND C18:1 > 2.70', defaultWhenFalse: 'Nguy cơ thấp', hasAsterisk: false },
  { index: 40, code: 'SS55_40', name: 'Bệnh tăng Proline máu type I (*)', expression: 'Pro > 250', defaultWhenFalse: 'Nguy cơ thấp (độ nhạy sàng lọc hạn chế)', hasAsterisk: true },
  { index: 41, code: 'SS55_41', name: 'Bệnh tăng Proline máu type II (*)', expression: 'Pro > 300', defaultWhenFalse: 'Nguy cơ thấp (độ nhạy sàng lọc hạn chế)', hasAsterisk: true },
  { index: 42, code: 'SS55_42', name: 'Bệnh tăng Hydroxyproline máu (*)', expression: 'OH-Pro > 50', defaultWhenFalse: 'Nguy cơ thấp (độ nhạy sàng lọc hạn chế)', hasAsterisk: true },
  { index: 43, code: 'SS55_43', name: 'Bệnh thiếu Ornithine transcarbamylase (OTC) (*)', expression: 'Cit < 5.0', defaultWhenFalse: 'Nguy cơ thấp (độ nhạy sàng lọc hạn chế)', hasAsterisk: true },
  { index: 44, code: 'SS55_44', name: 'Bệnh tăng Ornithine máu (HHH syndrome) (*)', expression: 'Orn > 150', defaultWhenFalse: 'Nguy cơ thấp (độ nhạy sàng lọc hạn chế)', hasAsterisk: true },
  { index: 45, code: 'SS55_45', name: 'Bệnh tăng Sarcosine máu (*)', expression: 'Sar > 20', defaultWhenFalse: 'Nguy cơ thấp (độ nhạy sàng lọc hạn chế)', hasAsterisk: true },
  { index: 46, code: 'SS55_46', name: 'Bệnh tăng Glycine không nhiễm ceton (NKH) (*)', expression: 'Gly > 600', defaultWhenFalse: 'Nguy cơ thấp (độ nhạy sàng lọc hạn chế)', hasAsterisk: true },
  { index: 47, code: 'SS55_47', name: 'Bệnh tăng Histidine máu (*)', expression: 'His > 150', defaultWhenFalse: 'Nguy cơ thấp (độ nhạy sàng lọc hạn chế)', hasAsterisk: true },
  { index: 48, code: 'SS55_48', name: 'Bệnh Pyroglutamic acid niệu (5-Oxoprolinuria) (*)', expression: 'Pyro > 50', defaultWhenFalse: 'Nguy cơ thấp (độ nhạy sàng lọc hạn chế)', hasAsterisk: true },
  { index: 49, code: 'SS55_49', name: 'Bệnh thiếu Carbamoyl phosphate synthetase I (CPS I) (*)', expression: 'Cit < 5.0 AND Arg < 10', defaultWhenFalse: 'Nguy cơ thấp (độ nhạy sàng lọc hạn chế)', hasAsterisk: true },
  { index: 50, code: 'SS55_50', name: 'Bệnh thiếu N-Acetylglutamate synthase (NAGS) (*)', expression: 'Cit < 5.0 AND Arg < 10', defaultWhenFalse: 'Nguy cơ thấp (độ nhạy sàng lọc hạn chế)', hasAsterisk: true },
  { index: 51, code: 'SS55_51', name: 'Bệnh Galactosemia (GALT / GALE / GALK)', expression: 'Gal > 10', defaultWhenFalse: 'Nguy cơ thấp', hasAsterisk: false },
  { index: 52, code: 'SS55_52', name: 'Bệnh thiếu hụt Biotinidase', expression: 'Bio < 30', defaultWhenFalse: 'Nguy cơ thấp', hasAsterisk: false },
  { index: 53, code: 'SS55_53', name: 'Bệnh tăng sản thượng thận bẩm sinh (CAH)', expression: '17-OHP > 30', defaultWhenFalse: 'Nguy cơ thấp', hasAsterisk: false },
  { index: 54, code: 'SS55_54', name: 'Bệnh suy giáp bẩm sinh (CH)', expression: 'TSH > 10', defaultWhenFalse: 'Nguy cơ thấp', hasAsterisk: false },
  { index: 55, code: 'SS55_55', name: 'Bệnh thiếu men G6PD', expression: 'G6PD < 2.0', defaultWhenFalse: 'Nguy cơ thấp', hasAsterisk: false }
];

export class NewbornScreening55DomainService {
  /**
   * Đánh giá sàng lọc toàn diện cho gói 55 bệnh sơ sinh MS/MS
   */
  public static evaluateScreening(
    markerEvaluations: MarkerEvaluation[],
    rules: readonly NewbornDiseaseRule[] = DEFAULT_55_DISEASE_RULES
  ): NewbornScreeningEvaluationSummary {
    // 1. Tạo bản đồ giá trị marker gốc
    const rawValues: Record<string, number | null> = {};
    for (const m of markerEvaluations) {
      rawValues[normalizeMarkerKey(m.marker)] = m.value;
    }

    const diseaseResults: DiseaseEvaluationResult[] = [];
    const highRiskDiseases: DiseaseEvaluationResult[] = [];
    const allBreachedMarkers: Set<string> = new Set();

    // 2. Đánh giá từng bệnh theo quy tắc
    for (const r of rules) {
      const evalRes = evaluateConditionExpression(r.expression, rawValues);

      let status: NewbornDiseaseRiskStatus;
      let statusText: string;

      if (evalRes.result === null) {
        status = 'UNDETERMINED';
        statusText = 'Chưa xác định';
      } else if (evalRes.result === true) {
        status = 'HIGH_RISK';
        statusText = 'Nguy cơ cao';
        evalRes.breachedMarkers.forEach(m => allBreachedMarkers.add(m));
      } else {
        status = r.hasAsterisk ? 'LOW_RISK_LIMITED' : 'LOW_RISK';
        statusText = r.defaultWhenFalse;
      }

      const res: DiseaseEvaluationResult = {
        index: r.index,
        code: r.code,
        name: r.name,
        status,
        statusText,
        breachedMarkers: evalRes.breachedMarkers,
        expression: r.expression
      };

      diseaseResults.push(res);
      if (status === 'HIGH_RISK') {
        highRiskDiseases.push(res);
      }
    }

    // 3. Quy tắc marker dùng chung: Nếu marker vượt ngưỡng, tất cả bệnh dùng marker đó cùng báo Nguy cơ cao
    if (allBreachedMarkers.size > 0) {
      for (let i = 0; i < diseaseResults.length; i++) {
        const item = diseaseResults[i];
        if (item.status !== 'HIGH_RISK') {
          // Kiểm tra xem biểu thức của bệnh này có chứa marker vượt ngưỡng không
          for (const breached of allBreachedMarkers) {
            const normBreached = normalizeMarkerKey(breached);
            const regex = new RegExp(`\\b${normBreached}\\b`, 'i');
            if (regex.test(normalizeMarkerKey(item.expression))) {
              diseaseResults[i] = {
                ...item,
                status: 'HIGH_RISK',
                statusText: 'Nguy cơ cao',
                breachedMarkers: Array.from(new Set([...item.breachedMarkers, breached]))
              };
              if (!highRiskDiseases.some(d => d.code === item.code)) {
                highRiskDiseases.push(diseaseResults[i]);
              }
              break;
            }
          }
        }
      }
    }

    const breachedMarkerList = Array.from(allBreachedMarkers);

    // 4. Tìm các marker ngoài ngưỡng nhưng không ứng với bệnh nào (ví dụ Met < 10, C2 < 8,0)
    const outOfRangeMarkersWithoutDisease: string[] = [];
    for (const m of markerEvaluations) {
      if (m.isOutOfRange) {
        const normMarker = normalizeMarkerKey(m.marker);
        const isMappedToHighRisk = breachedMarkerList.some(
          b => normalizeMarkerKey(b) === normMarker
        );
        if (!isMappedToHighRisk) {
          outOfRangeMarkersWithoutDisease.push(m.marker);
        }
      }
    }

    // 5. Tự động sinh kết luận lâm sàng theo 3 nhánh quy định
    let autoConclusion = '';
    const outOfRangeSuffix =
      outOfRangeMarkersWithoutDisease.length > 0
        ? ` Chỉ số ngoài giới hạn sàng lọc cần bác sĩ xem xét: ${outOfRangeMarkersWithoutDisease.join(', ')}.`
        : '';

    if (highRiskDiseases.length > 0) {
      const diseaseNames = highRiskDiseases.map(d => d.name).join(', ');
      const markerText = breachedMarkerList.join(', ');
      autoConclusion = `Nguy cơ cao với: ${diseaseNames} (marker: ${markerText}). Đề nghị lấy mẫu lại và/hoặc làm xét nghiệm khẳng định; liên hệ bác sĩ chuyên khoa để được tư vấn.${outOfRangeSuffix}`;
    } else {
      autoConclusion = `Các chỉ số được báo cáo nằm trong giới hạn sàng lọc theo ngưỡng áp dụng trên phiếu. Kết quả sàng lọc không phải chẩn đoán xác định và không loại trừ hoàn toàn bệnh.${outOfRangeSuffix}`;
    }

    return {
      markerEvaluations,
      diseaseResults,
      highRiskDiseases,
      breachedMarkers: breachedMarkerList,
      outOfRangeMarkersWithoutDisease,
      autoConclusion
    };
  }
}
