import { AllergenGradeResult, AllergenGrade } from './types';

export function calculateAllergenGrade(valStr: string | number | null | undefined): AllergenGradeResult {
  if (valStr === undefined || valStr === null || String(valStr).trim() === '') {
    return { grade: 0, iuValue: '<0,15', note: 'Âm tính (Độ 0)', statusStr: 'Âm tính' };
  }
  
  const cleanStr = String(valStr).trim().replace(',', '.');
  const num = parseFloat(cleanStr);

  if (isNaN(num)) {
    const matchGrade = cleanStr.match(/^([0-6])$/);
    if (matchGrade) {
      const g = parseInt(matchGrade[1], 10) as AllergenGrade;
      const iu = g === 0 ? '<0,15' : g === 1 ? '0,55' : g === 2 ? '1,15' : g === 3 ? '4,50' : g === 4 ? '25,0' : g === 5 ? '75,0' : '120,0';
      const notes = [
        'Âm tính (Độ 0)',
        'Dương tính yếu (Độ 1)',
        'Dương tính trung bình (Độ 2)',
        'Dương tính khá (Độ 3)',
        'Dương tính mạnh (Độ 4)',
        'Dương tính rất mạnh (Độ 5)',
        'Dương tính cực mạnh (Độ 6)'
      ];
      return { grade: g, iuValue: iu, note: notes[g], statusStr: g > 0 ? 'Dương tính' : 'Âm tính' };
    }
    return { grade: 0, iuValue: String(valStr), note: 'Âm tính (Độ 0)', statusStr: 'Âm tính' };
  }

  let grade: AllergenGrade = 0;
  let note = 'Âm tính (Độ 0)';

  if (num >= 100.0) {
    grade = 6;
    note = 'Dương tính cực mạnh (Độ 6)';
  } else if (num >= 50.0) {
    grade = 5;
    note = 'Dương tính rất mạnh (Độ 5)';
  } else if (num >= 17.5) {
    grade = 4;
    note = 'Dương tính mạnh (Độ 4)';
  } else if (num >= 3.5) {
    grade = 3;
    note = 'Dương tính khá (Độ 3)';
  } else if (num >= 0.7) {
    grade = 2;
    note = 'Dương tính trung bình (Độ 2)';
  } else if (num >= 0.35) {
    grade = 1;
    note = 'Dương tính yếu (Độ 1)';
  } else {
    grade = 0;
    note = 'Âm tính (Độ 0)';
  }

  return {
    grade,
    iuValue: String(num).replace('.', ','),
    note,
    statusStr: grade > 0 ? 'Dương tính' : 'Âm tính'
  };
}
