import type { MedicalReport, Patient } from '../types';

export interface PatientMatchCriteria {
  id?: string;
  code?: string;
  patient?: Partial<Patient>;
  hasExplicitCode?: boolean;
  allowIdentityMerge?: boolean;
}

export class PatientIdentityDomainService {
  /**
   * Chuẩn hóa tên phục vụ nhận diện định danh bệnh nhân
   * Loại bỏ dấu tiếng Việt, khoảng trắng thừa và ký tự đặc biệt
   */
  public static normalizeName(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  /**
   * Chuẩn hóa ngày sinh phục vụ nhận diện định danh bệnh nhân
   * Phân tích các thành phần ngày/tháng/năm để DD/MM/YYYY và YYYY-MM-DD khớp nhau (chuẩn YYYYMMDD)
   */
  public static normalizeDob(raw: string | undefined): string {
    if (!raw) return '';
    const trimmed = raw.trim();
    if (!trimmed) return '';

    // Match YYYY-MM-DD hoặc YYYY/MM/DD
    const isoMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (isoMatch) {
      const year = isoMatch[1];
      const month = isoMatch[2].padStart(2, '0');
      const day = isoMatch[3].padStart(2, '0');
      return `${year}${month}${day}`;
    }

    // Match DD/MM/YYYY hoặc DD-MM-YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      const year = dmyMatch[3];
      return `${year}${month}${day}`;
    }

    // Match chỉ năm YYYY
    if (/^\d{4}$/.test(trimmed)) {
      return trimmed;
    }

    // Chuẩn hóa chuỗi số thô
    const digits = trimmed.replace(/[^\d]/g, '');
    if (digits.length === 8) {
      const first4 = parseInt(digits.slice(0, 4), 10);
      const last4 = parseInt(digits.slice(4), 10);
      if (first4 >= 1900 && first4 <= 2100) {
        return digits;
      }
      if (last4 >= 1900 && last4 <= 2100) {
        const dd = digits.slice(0, 2);
        const mm = digits.slice(2, 4);
        const yyyy = digits.slice(4);
        return `${yyyy}${mm}${dd}`;
      }
    }

    return digits;
  }

  /**
   * Tìm vị trí phiếu xét nghiệm khớp với tiêu chí đối soát
   * 1. Ưu tiên khớp theo ID cụ thể
   * 2. Khớp theo Mã BN (nếu có explicit code)
   * 3. Khớp theo Bộ ba Định Danh (Họ tên không dấu + Ngày sinh) khi allowIdentityMerge = true
   */
  public static findMatchingIndex(
    list: MedicalReport[],
    criteria: PatientMatchCriteria
  ): number {
    // 1. Đối soát theo ID nếu có
    if (criteria.id) {
      const idx = list.findIndex((r) => r.id === criteria.id);
      if (idx >= 0) return idx;
    }

    // 2. Đối soát theo Mã BN cụ thể (người dùng tự nhập hoặc file có cột mã BN)
    const code = criteria.code || criteria.patient?.code;
    if (criteria.hasExplicitCode && code) {
      const cleanTargetCode = code.trim().toLowerCase();
      const idx = list.findIndex(
        (r) =>
          (r.code && r.code.trim().toLowerCase() === cleanTargetCode) ||
          (r.patient?.code && r.patient.code.trim().toLowerCase() === cleanTargetCode)
      );
      if (idx >= 0) return idx;
    }

    // 3. Chỉ đối soát theo Bộ Ba Định Danh khi được phép gộp (allowIdentityMerge)
    // Áp dụng cho các trường hợp Import hàng loạt từ file Excel không có cột mã BN
    if (criteria.allowIdentityMerge && criteria.patient?.name && criteria.patient?.dob) {
      const targetName = this.normalizeName(criteria.patient.name);
      const targetDob = this.normalizeDob(criteria.patient.dob);
      if (targetName && targetDob) {
        const idx = list.findIndex((r) => {
          if (!r.patient?.name || !r.patient?.dob) return false;
          const nameMatch = this.normalizeName(r.patient.name) === targetName;
          if (!nameMatch) return false;

          const dobMatch = this.normalizeDob(r.patient.dob) === targetDob;
          if (!dobMatch) return false;

          const targetGender = criteria.patient?.gender;
          if (targetGender && r.patient.gender && targetGender !== r.patient.gender) {
            return false;
          }

          return true;
        });
        if (idx >= 0) return idx;
      }
    }

    return -1;
  }
}
