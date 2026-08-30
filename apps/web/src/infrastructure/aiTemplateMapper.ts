import {
  CatalogItem,
  CatalogItemEquipmentLink,
  TestPackage,
  Doctor,
  TestEquipment,
  TestGroup,
  AllergenGradingScale,
  BatchImportRow,
  AiTemplateTarget,
  ExtractedRowItem
} from '@domain';
import {
  exportCatalogItemsTemplate,
  exportCatalogItemEquipmentsTemplate,
  exportTestPackagesTemplate,
  exportDoctorsTemplate,
  exportEquipmentsTemplate,
  exportTestGroupsTemplate,
  exportScalesTemplate,
  saveExcelJsWorkbook
} from './excelService';
import ExcelJS from 'exceljs';

/**
 * Xuất file Excel Mẫu đã được AI điền đầy đủ dữ liệu
 */
export async function exportFilledTemplateExcel(
  target: AiTemplateTarget,
  rows: ExtractedRowItem[],
  context: {
    catalog: CatalogItem[];
    equipments: TestEquipment[];
    testGroups: TestGroup[];
    doctors: Doctor[];
    scales: AllergenGradingScale[];
  }
): Promise<void> {
  const selectedRows = rows.filter((r) => r.isSelected);

  switch (target) {
    case 'CATALOG_ITEMS': {
      const items: CatalogItem[] = selectedRows.map((r) => {
        const d = r.data as Partial<CatalogItem>;
        return {
          category: d.category || 'Sinh Hóa',
          code: (d.code || 'UNKNOWN').toUpperCase(),
          name: d.name || 'Chỉ số',
          scientific: d.scientific,
          unit: d.unit || '',
          evaluationType: d.evaluationType || 'range',
          refMin: d.refMin ?? null,
          refMax: d.refMax ?? null,
          scaleId: d.scaleId,
          refText: d.refText || '',
          price: d.price || 40000
        };
      });
      await exportCatalogItemsTemplate(context.testGroups, items, { isSampleOnly: false });
      break;
    }

    case 'CATALOG_ITEM_EQUIPMENTS': {
      const links: CatalogItemEquipmentLink[] = selectedRows.map((r) => {
        const d = r.data as Record<string, unknown>;
        return {
          id: `cie_${String(d.catalogCode).toLowerCase()}_${Date.now()}`,
          catalogCode: String(d.catalogCode || 'GLU').toUpperCase(),
          equipmentId: String(d.equipmentId || context.equipments[0]?.id || 'eq_1'),
          evaluationType: (d.evaluationType as 'range' | 'scale') || 'range',
          refMin: typeof d.refMin === 'number' ? d.refMin : null,
          refMax: typeof d.refMax === 'number' ? d.refMax : null,
          unit: String(d.unit || ''),
          refText: String(d.refText || ''),
          scaleId: d.scaleId ? String(d.scaleId) : undefined,
          isDefault: !!d.isDefault
        };
      });
      await exportCatalogItemEquipmentsTemplate(context.catalog, context.equipments, links, { isSampleOnly: false });
      break;
    }

    case 'TEST_PACKAGES': {
      const pkgs: TestPackage[] = selectedRows.map((r) => {
        const d = r.data as Record<string, unknown>;
        const itemCodes = Array.isArray(d.itemCodes) ? (d.itemCodes as string[]) : [];
        return {
          id: `pkg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: String(d.name || 'Gói Mới'),
          price: typeof d.price === 'number' ? d.price : 450000,
          defaultEquipmentId: d.defaultEquipmentId ? String(d.defaultEquipmentId) : null,
          items: itemCodes.map((code) => ({ code, equipmentId: null }))
        };
      });
      await exportTestPackagesTemplate(context.catalog, context.equipments, pkgs, { isSampleOnly: false });
      break;
    }

    case 'DOCTORS': {
      const docs: Doctor[] = selectedRows.map((r) => {
        const d = r.data as Partial<Doctor>;
        return {
          id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: d.name || 'Bác Sĩ',
          specialty: d.specialty,
          phone: d.phone
        };
      });
      await exportDoctorsTemplate(docs, false);
      break;
    }

    case 'EQUIPMENTS': {
      const eqs: TestEquipment[] = selectedRows.map((r) => {
        const d = r.data as Partial<TestEquipment>;
        return {
          id: `eq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: d.name || 'Thiết Bị',
          code: d.code
        };
      });
      await exportEquipmentsTemplate(eqs, false);
      break;
    }

    case 'TEST_GROUPS': {
      const grps: TestGroup[] = selectedRows.map((r) => {
        const d = r.data as Partial<TestGroup>;
        return {
          id: `grp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: d.name || 'Nhóm Xét Nghiệm'
        };
      });
      await exportTestGroupsTemplate(grps, false);
      break;
    }

    case 'ALLERGEN_SCALES': {
      const scs: AllergenGradingScale[] = selectedRows.map((r) => {
        const d = r.data as Partial<AllergenGradingScale>;
        return {
          id: `scale_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: d.name || 'Thang Đo Mới',
          equipment: d.equipment,
          unit: d.unit || 'IU/ml',
          levels: Array.isArray(d.levels) ? d.levels : []
        };
      });
      await exportScalesTemplate(scs, false);
      break;
    }

    case 'BATCH_PATIENTS': {
      // Xuất file Excel Khám đoàn điền sẵn danh sách bệnh nhân và kết quả
      const wb = new ExcelJS.Workbook();
      wb.creator = 'GoLab Medical AI';
      wb.created = new Date();
      const ws = wb.addWorksheet('Danh Sách Khám Đoàn (AI)', { views: [{ state: 'frozen', ySplit: 1 }] });

      const testCodeSet = new Set<string>();
      selectedRows.forEach((r) => {
        const d = r.data as { testResults?: Record<string, string> };
        if (d.testResults) {
          Object.keys(d.testResults).forEach((code) => testCodeSet.add(code.toUpperCase()));
        }
      });
      const uniqueTestCodes = Array.from(testCodeSet);

      const columns = [
        { header: 'STT', key: 'stt', width: 6 },
        { header: 'Mã BN (*)', key: 'code', width: 16 },
        { header: 'Họ và Tên (*)', key: 'name', width: 26 },
        { header: 'Năm Sinh (*)', key: 'dob', width: 14 },
        { header: 'Giới Tính (*)', key: 'gender', width: 14 },
        { header: 'Số Điện Thoại', key: 'phone', width: 16 },
        { header: 'Địa Chỉ / Công Ty', key: 'address', width: 28 },
        { header: 'BS Chỉ Định', key: 'doctor', width: 24 },
        { header: 'Chẩn Đoán', key: 'diagnosis', width: 26 },
        { header: 'Kết Luận', key: 'conclusion', width: 32 }
      ];

      uniqueTestCodes.forEach((code) => {
        const item = context.catalog.find((c) => c.code.toUpperCase() === code);
        columns.push({
          header: item ? `${item.name} [${item.code}]` : `Chỉ số [${code}]`,
          key: `test_${code}`,
          width: 20
        });
      });

      ws.columns = columns;

      const headerRow = ws.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 28;

      selectedRows.forEach((r, idx) => {
        const d = r.data as Record<string, unknown>;
        const testResults = (d.testResults as Record<string, string>) || {};
        const rowPayload: Record<string, unknown> = {
          stt: idx + 1,
          code: d.code || `BN-${String(idx + 1).padStart(3, '0')}`,
          name: d.name || 'BỆNH NHÂN',
          dob: d.dob || '1990',
          gender: d.gender || 'Nam',
          phone: d.phone || '',
          address: d.address || '',
          doctor: d.doctor || '',
          diagnosis: d.diagnosis || 'Khám sức khỏe định kỳ',
          conclusion: d.conclusion || ''
        };

        uniqueTestCodes.forEach((code) => {
          rowPayload[`test_${code}`] = testResults[code] || '';
        });

        ws.addRow(rowPayload);
      });

      await saveExcelJsWorkbook(wb, `GoLab_Kham_Doan_AI_Fill_${new Date().toISOString().slice(0, 10)}.xlsx`);
      break;
    }
  }
}

/**
 * Chuyển đổi dữ liệu AI sang BatchImportRow cho tính năng Khám Đoàn
 */
export function convertAiRowsToBatchImportRows(
  rows: ExtractedRowItem[],
  catalog: CatalogItem[]
): BatchImportRow[] {
  return rows
    .filter((r) => r.isSelected)
    .map((r, idx) => {
      const d = r.data as Record<string, unknown>;
      const testResults = (d.testResults as Record<string, string>) || {};
      const selectedTests = Object.entries(testResults).map(([code, val]) => {
        const it = catalog.find((c) => c.code.toUpperCase() === code.toUpperCase());
        const baseItem: CatalogItem = it || {
          code: code.toUpperCase(),
          name: code,
          category: 'Sinh Hóa',
          unit: '',
          price: 40000,
          refMin: null,
          refMax: null,
          refText: ''
        };
        return {
          ...baseItem,
          result: String(val).trim(),
          note: 'Bình thường'
        };
      });

      return {
        stt: idx + 1,
        rowNumber: idx + 2,
        patient: {
          code: String(d.code || `BN-${String(idx + 1).padStart(3, '0')}`),
          secretToken: String(d.secretToken || Math.random().toString(36).substring(2, 10).toUpperCase()),
          name: String(d.name || 'BỆNH NHÂN').toUpperCase(),
          dob: String(d.dob || '1990'),
          gender: (d.gender === 'Nữ' ? 'Nữ' : 'Nam') as 'Nam' | 'Nữ',
          phone: String(d.phone || ''),
          address: String(d.address || ''),
          diagnosis: String(d.diagnosis || 'Khám sức khỏe định kỳ')
        },
        doctorName: String(d.doctor || 'BS. Nguyễn Thị Thành Trung'),
        conclusion: String(d.conclusion || ''),
        selectedTests,
        hasError: false
      };
    });
}
