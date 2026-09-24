import { AllergenGradeResult, AllergenGrade, AllergenGradingScale } from './types';

/**
 * Chuẩn hóa thang đo dị nguyên, bảo đảm `levels` luôn là một mảng JavaScript hợp lệ
 * (kể cả khi nạp từ PostgreSQL / Supabase dưới dạng chuỗi JSON).
 */
export function normalizeAllergenScale(scale?: AllergenGradingScale | null): AllergenGradingScale | undefined {
  if (!scale) return undefined;
  let levels = scale.levels;
  if (typeof levels === 'string') {
    try {
      levels = JSON.parse(levels);
    } catch {
      levels = [];
    }
  }
  if (!Array.isArray(levels)) {
    levels = [];
  }
  return {
    ...scale,
    levels
  };
}

/**
 * Lấy thông tin thang đo dị nguyên theo ID từ danh sách thang đo (customScales) nạp từ cơ sở dữ liệu.
 * Hoàn toàn hướng cơ sở dữ liệu (Database-Driven), không sử dụng hằng số tĩnh hardcode.
 */
export function getAllergenScaleById(
  id?: string,
  customScales?: AllergenGradingScale[]
): AllergenGradingScale | undefined {
  if (!customScales || customScales.length === 0) {
    return undefined;
  }
  const found = id ? customScales.find((s) => s.id === id) : customScales[0];
  return found ? normalizeAllergenScale(found) : undefined;
}

export function calculateAllergenGrade(
  valStr: string | number | null | undefined,
  scaleInput?: AllergenGradingScale
): AllergenGradeResult {
  const scale = normalizeAllergenScale(scaleInput);
  const levels = scale?.levels || [];

  if (valStr === undefined || valStr === null || String(valStr).trim() === '') {
    const level0 = levels.find((l) => l.grade === 0) || levels[0];
    const defaultText = level0?.rangeText || (level0?.maxVal != null ? `<${level0.maxVal}` : '<0.34');
    return { grade: 0, iuValue: defaultText, note: 'Âm tính (Độ 0)', statusStr: 'Âm tính' };
  }

  const cleanStr = String(valStr).trim().replace(',', '.');
  const num = parseFloat(cleanStr);

  if (!scale || levels.length === 0) {
    if (cleanStr.startsWith('<')) {
      return { grade: 0, iuValue: cleanStr, note: 'Âm tính (Độ 0)', statusStr: 'Âm tính' };
    }
    if (isNaN(num)) {
      return { grade: 0, iuValue: String(valStr), note: '', statusStr: 'Âm tính' };
    }
    return {
      grade: 0,
      iuValue: String(num).replace('.', ','),
      note: '',
      statusStr: 'Âm tính'
    };
  }

  if (isNaN(num)) {
    const matchGrade = cleanStr.match(/(?:Độ|do|grade)?\s*([0-6])/i);
    if (matchGrade) {
      const g = parseInt(matchGrade[1], 10) as AllergenGrade;
      const matchedLevel = levels.find((l) => l.grade === g);
      const iu = matchedLevel
        ? g === 0
          ? (levels[0]?.rangeText || '<0,34')
          : String(matchedLevel.minVal).replace('.', ',')
        : g === 0
          ? '<0,34'
          : '1,15';
      const note = matchedLevel
        ? matchedLevel.grade === 0
          ? 'Âm tính (Độ 0)'
          : `Dương tính ${matchedLevel.label.toLowerCase()} (Độ ${matchedLevel.grade})`
        : g > 0
          ? `Dương tính (Độ ${g})`
          : 'Âm tính (Độ 0)';

      return { grade: g, iuValue: iu, note, statusStr: g > 0 ? 'Dương tính' : 'Âm tính' };
    }
    return { grade: 0, iuValue: String(valStr), note: 'Âm tính (Độ 0)', statusStr: 'Âm tính' };
  }

  // Sắp xếp các mức theo minVal giảm dần để so sánh
  const sortedLevels = [...levels].sort((a, b) => b.minVal - a.minVal);
  let matchedLevel = sortedLevels.find((l) => num >= l.minVal);

  if (!matchedLevel) {
    matchedLevel = levels[0] || {
      grade: 0,
      minVal: 0,
      maxVal: 0.34,
      rangeText: '<0,34',
      label: 'Không phản ứng',
      isPositive: false
    };
  }

  const grade = (matchedLevel.grade || 0) as AllergenGrade;
  const rawLabel = matchedLevel.label || (matchedLevel as { interpretation?: string }).interpretation || '';
  const cleanLabel = rawLabel.trim();
  const note =
    grade === 0
      ? 'Âm tính (Độ 0)'
      : cleanLabel
        ? `Dương tính ${cleanLabel.toLowerCase()} (Độ ${grade})`
        : `Dương tính (Độ ${grade})`;

  return {
    grade,
    iuValue: String(num).replace('.', ','),
    note,
    statusStr: grade > 0 ? 'Dương tính' : 'Âm tính'
  };
}

