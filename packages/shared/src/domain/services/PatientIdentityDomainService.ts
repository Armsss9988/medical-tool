import type { MedicalReport, Patient } from '../types';

export interface PatientMatchCriteria {
  id?: string;
  code?: string;
  patient?: Patient;
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
   */
  public static normalizeDob(raw: string | undefined): string {
    if (!raw) return '';
    return raw.trim().replace(/[^\d]/g, '');
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
