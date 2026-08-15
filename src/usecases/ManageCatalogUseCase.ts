import { CatalogItem, TestGroup, TestEquipment, Doctor } from '../domain/types';

export class ManageCatalogUseCase {
  public canDeleteGroup(groupId: string, groups: TestGroup[], catalog: CatalogItem[]): { canDelete: boolean; message?: string } {
    const targetGroup = groups.find((g) => g.id === groupId);
    if (!targetGroup) return { canDelete: false, message: 'Không tìm thấy nhóm cần xóa.' };

    const refCount = catalog.filter(
      (item) => item.category.trim().toLowerCase() === targetGroup.name.trim().toLowerCase()
    ).length;

    if (refCount > 0) {
      return {
        canDelete: false,
        message: `⚠️ KHÔNG THỂ XÓA NHÓM "${targetGroup.name}"!\n\nĐang có ${refCount} chỉ số/dị nguyên đang thuộc nhóm này. Vui lòng đổi nhóm cho các chỉ số đó trước khi xóa.`
      };
    }

    return { canDelete: true };
  }

  public canDeleteEquipment(equipmentId: string, equipments: TestEquipment[], catalog: CatalogItem[]): { canDelete: boolean; message?: string } {
    const targetEq = equipments.find((e) => e.id === equipmentId);
    if (!targetEq) return { canDelete: false, message: 'Không tìm thấy thiết bị cần xóa.' };

    const refCount = catalog.filter(
      (item) => (item.equipment || '').trim().toLowerCase() === targetEq.name.trim().toLowerCase()
    ).length;

    if (refCount > 0) {
      return {
        canDelete: false,
        message: `⚠️ KHÔNG THỂ XÓA THIẾT BỊ "${targetEq.name}"!\n\nĐang có ${refCount} chỉ số/dị nguyên đang được gán cho thiết bị này. Vui lòng chuyển thiết bị khác trước khi xóa.`
      };
    }

    return { canDelete: true };
  }

  public canDeleteDoctor(doctorId: string, doctors: Doctor[]): { canDelete: boolean; message?: string } {
    const targetDoc = doctors.find((d) => d.id === doctorId);
    if (!targetDoc) return { canDelete: false, message: 'Không tìm thấy bác sĩ cần xóa.' };
    return { canDelete: true };
  }
}
