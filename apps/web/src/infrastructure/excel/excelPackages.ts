import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import type { CatalogItem, TestEquipment, TestPackage, PackageItem } from '@domain/types';
import { saveExcelJsWorkbook, getRowValue, readFileAsArrayBuffer } from './excelHelpers';

export interface PackageExportOptions {
  isSampleOnly?: boolean;
  filterPackageId?: string;
}

/**
 * Xuất file Excel template (hoặc data) cho Gói xét nghiệm
 */
export async function exportTestPackagesTemplate(
  items: CatalogItem[],
  equipments: TestEquipment[],
  packages: TestPackage[] = [],
  options: PackageExportOptions = {}
): Promise<void> {
  const { isSampleOnly = true, filterPackageId = 'all' } = options;

  let targetPackageRows: {
    packageName: string;
    defaultEquipmentName: string;
    itemCode: string;
    itemName: string;
    equipmentName: string;
    price: number;
  }[] = [];

  const targetPkg = filterPackageId !== 'all' ? packages.find(p => p.id === filterPackageId) : null;

  if (isSampleOnly) {
    if (targetPkg) {
      const defEq = equipments.find(e => e.id === targetPkg.defaultEquipmentId);
      const pkgItems = targetPkg.items && targetPkg.items.length > 0 ? targetPkg.items : (targetPkg.codes || []).map(c => ({ code: c, equipmentId: null }));
      targetPackageRows = pkgItems.map((pi) => {
        const eq = equipments.find(e => e.id === pi.equipmentId);
        const it = items.find(i => i.code.toLowerCase() === pi.code.toLowerCase());
        return {
          packageName: targetPkg.name,
          defaultEquipmentName: defEq ? defEq.name : '',
          itemCode: pi.code,
          itemName: it ? it.name : pi.code,
          equipmentName: eq ? eq.name : '',
          price: targetPkg.price || 0
        };
      });
    } else {
      targetPackageRows = [
        { packageName: 'Gói Khám Sức Khỏe Tổng Quát Cơ Bản', defaultEquipmentName: 'Máy Sinh Hóa Tự Động MS-360', itemCode: 'GLU', itemName: 'Glucose máu', equipmentName: 'Máy Sinh Hóa Tự Động MS-360', price: 450000 },
        { packageName: 'Gói Khám Sức Khỏe Tổng Quát Cơ Bản', defaultEquipmentName: 'Máy Sinh Hóa Tự Động MS-360', itemCode: 'URE', itemName: 'Ure máu', equipmentName: 'Máy Sinh Hóa Tự Động MS-360', price: 450000 },
        { packageName: 'Gói Khám Sức Khỏe Tổng Quát Cơ Bản', defaultEquipmentName: 'Máy Sinh Hóa Tự Động MS-360', itemCode: 'WBC', itemName: 'Số lượng bạch cầu', equipmentName: 'Máy Phân Tích Huyết Học MS-H630', price: 450000 },
        { packageName: 'Gói Khám Sức Khỏe Tổng Quát Cơ Bản', defaultEquipmentName: 'Máy Sinh Hóa Tự Động MS-360', itemCode: 'LEU_U', itemName: 'Bạch cầu nước tiểu', equipmentName: '', price: 450000 },
        { packageName: 'Panel 91 Dị Nguyên PROTIA Chuyên Sâu', defaultEquipmentName: 'PROTIA Allergy-Q Smart Q-processor', itemCode: 'DN91', itemName: 'Panel 91 Dị Nguyên', equipmentName: 'PROTIA Allergy-Q Smart Q-processor', price: 1900000 }
      ];
    }
  } else {
    const filteredPackages = filterPackageId !== 'all'
      ? packages.filter(p => p.id === filterPackageId)
      : packages;

    targetPackageRows = filteredPackages.flatMap((pkg) => {
      const defEq = equipments.find(e => e.id === pkg.defaultEquipmentId);
      const pkgItems = pkg.items && pkg.items.length > 0 ? pkg.items : (pkg.codes || []).map(c => ({ code: c, equipmentId: null }));
      return pkgItems.map((pi) => {
        const eq = equipments.find(e => e.id === pi.equipmentId);
        const it = items.find(i => i.code.toLowerCase() === pi.code.toLowerCase());
        return {
          packageName: pkg.name,
          defaultEquipmentName: defEq ? defEq.name : '',
          itemCode: pi.code,
          itemName: it ? it.name : pi.code,
          equipmentName: eq ? eq.name : '',
          price: pkg.price || 0
        };
      });
    });
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = 'GoLab Medical';
  wb.created = new Date();

  const ws = wb.addWorksheet('Gói Xét Nghiệm', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  const wsLookup = wb.addWorksheet('_DataLookup');

  const itemCodes = items.length > 0
    ? items.map(i => ({ code: i.code, name: i.name }))
    : [
        { code: 'GLU', name: 'Glucose máu' },
        { code: 'URE', name: 'Ure máu' },
        { code: 'CRE', name: 'Creatinine' },
        { code: 'AST', name: 'AST (GOT)' },
        { code: 'ALT', name: 'ALT (GPT)' },
        { code: 'WBC', name: 'Số lượng bạch cầu' },
        { code: 'RBC', name: 'Số lượng hồng cầu' },
        { code: 'HGB', name: 'Hemoglobin' },
        { code: 'LEU_U', name: 'Bạch cầu nước tiểu' },
        { code: 'DN91', name: 'Panel 91 Dị Nguyên PROTIA' }
      ];

  const eqNames = equipments.length > 0
    ? equipments.map(e => e.name)
    : ['Máy Sinh Hóa Tự Động MS-360', 'Máy Phân Tích Huyết Học MS-H630', 'PROTIA Allergy-Q Smart Q-processor', 'Roche cobas e 801'];

  wsLookup.columns = [
    { header: 'Mã Chỉ Số Khả Dụng', key: 'code', width: 22 },
    { header: 'Tên Chỉ Số Xét Nghiệm', key: 'name', width: 35 },
    { header: 'Thiết Bị / Máy Đo Khả Dụng', key: 'eq', width: 38 }
  ];

  const maxLookupRows = Math.max(itemCodes.length, eqNames.length, 5);
  for (let i = 0; i < maxLookupRows; i++) {
    wsLookup.addRow({
      code: itemCodes[i]?.code || '',
      name: itemCodes[i]?.name || '',
      eq: eqNames[i] || ''
    });
  }

  const lookupHeader = wsLookup.getRow(1);
  lookupHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  lookupHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };

  ws.columns = [
    { header: 'STT', key: 'stt', width: 6 },
    { header: 'Tên Gói Xét Nghiệm (*)', key: 'name', width: 38 },
    { header: 'Máy Đo Chính Của Gói (Tùy chọn) [Chọn Dropdown]', key: 'defaultEq', width: 38 },
    { header: 'Mã Chỉ Số Thành Phần (*) [Chọn Dropdown]', key: 'code', width: 32 },
    { header: 'Tên Chỉ Số [Tự động tra cứu - K cần nhập]', key: 'itemName', width: 35 },
    { header: 'Tên Máy Đo Áp Dụng (Tùy chọn) [Chọn Dropdown]', key: 'eq', width: 38 },
    { header: 'Đơn Giá Gói (VNĐ)', key: 'price', width: 18 }
  ];

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7E22CE' } }; // Purple 700
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 28;

  const itemEndRow = itemCodes.length + 1;
  const eqEndRow = eqNames.length + 1;

  targetPackageRows.forEach((row, idx) => {
    const r = idx + 2;
    const excelRow = ws.addRow({
      stt: idx + 1,
      name: row.packageName,
      defaultEq: row.defaultEquipmentName,
      code: row.itemCode,
      itemName: {
        formula: `=IFERROR(VLOOKUP(D${r},_DataLookup!$A$2:$B$${itemEndRow},2,FALSE),"")`,
        result: row.itemName || ''
      },
      eq: row.equipmentName,
      price: row.price
    });

    const nameCell = excelRow.getCell(5);
    nameCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
    nameCell.font = { color: { argb: 'FF047857' }, bold: true };
  });

  for (let r = 2; r <= 500; r++) {
    const row = ws.getRow(r);
    row.getCell(3).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`_DataLookup!$C$2:$C$${eqEndRow}`],
      showErrorMessage: true,
      errorTitle: 'Máy đo chính không hợp lệ',
      error: 'Vui lòng chọn máy đo từ danh sách dropdown'
    };
    row.getCell(4).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`_DataLookup!$A$2:$A$${itemEndRow}`],
      showErrorMessage: true,
      errorTitle: 'Mã chỉ số không hợp lệ',
      error: 'Vui lòng chọn mã chỉ số từ danh sách dropdown'
    };
    row.getCell(6).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`_DataLookup!$C$2:$C$${eqEndRow}`],
      showErrorMessage: true,
      errorTitle: 'Tên máy đo không hợp lệ',
      error: 'Vui lòng chọn máy đo từ danh sách dropdown'
    };

    if (r > targetPackageRows.length + 1) {
      const nameCell = row.getCell(5);
      nameCell.value = {
        formula: `=IFERROR(VLOOKUP(D${r},_DataLookup!$A$2:$B$${itemEndRow},2,FALSE),"")`
      };
      nameCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
      nameCell.font = { color: { argb: 'FF047857' }, bold: true };
    }
  }

  const pkgSuffix = targetPkg ? `_${targetPkg.name.replace(/[\s/\\:*?"<>|]+/g, '_')}` : '';
  const prefix = isSampleOnly ? 'GoLab_Mau_Goi_Xet_Nghiem' : 'GoLab_Danh_Sach_Goi_Xet_Nghiem';
  await saveExcelJsWorkbook(wb, `${prefix}${pkgSuffix}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export const exportPackagesTemplate = exportTestPackagesTemplate;

/**
 * Đọc file Excel Gói xét nghiệm
 */
export async function parseExcelTestPackages(
  fileOrBuffer: Blob | ArrayBuffer,
  _items: CatalogItem[],
  equipments: TestEquipment[]
): Promise<TestPackage[]> {
  const buffer = await readFileAsArrayBuffer(fileOrBuffer);
  const data = new Uint8Array(buffer);
  const workbook = XLSX.read(data, { type: 'array' });
  if (workbook.SheetNames.length === 0) return [];
  const ws = workbook.Sheets[workbook.SheetNames[0]];
  if (!ws) return [];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

  const packageMap = new Map<string, { id: string; name: string; defaultEquipmentId?: string | null; items: PackageItem[]; price: number }>();

  for (const row of rawRows) {
    const pkgName = getRowValue(row, ['ten_goi_xet_nghiem', 'ten_goi', 'ten', 'package_name', 'name']).trim();
    if (!pkgName) continue;

    let rawCode = getRowValue(row, ['ma_chi_so_thanh_phan', 'ma_chi_so', 'ma_xet_nghiem', 'code', 'item_code']);
    if (rawCode.includes('-')) rawCode = rawCode.split('-')[0].trim();
    const cleanCode = rawCode.toUpperCase().trim();
    if (!cleanCode) continue;

    const defEqRawName = getRowValue(row, ['may_do_chinh_cua_goi', 'may_do_chinh', 'default_equipment', 'primary_equipment']).trim();
    let defEqId: string | null = null;
    if (defEqRawName) {
      const matchedDefEq = equipments.find(e => e.name.toLowerCase() === defEqRawName.toLowerCase() || (e.code && e.code.toLowerCase() === defEqRawName.toLowerCase()));
      defEqId = matchedDefEq ? matchedDefEq.id : 'eq_' + defEqRawName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }

    const eqRawName = getRowValue(row, ['ten_may_do_ap_dung', 'ten_may_do', 'may_do', 'equipment', 'equipment_name']).trim();
    let eqId: string | null = null;
    if (eqRawName) {
      const matchedEq = equipments.find(e => e.name.toLowerCase() === eqRawName.toLowerCase() || (e.code && e.code.toLowerCase() === eqRawName.toLowerCase()));
      eqId = matchedEq ? matchedEq.id : 'eq_' + eqRawName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }

    const rawPrice = getRowValue(row, ['don_gia_goi_vnd', 'don_gia_goi', 'gia_goi', 'don_gia', 'price']);
    const price = parseFloat(rawPrice.replace(/[^\d.]/g, '')) || 0;

    const pkgKey = pkgName.toLowerCase();
    if (!packageMap.has(pkgKey)) {
      const explicitPkgId = getRowValue(row, ['ma_goi', 'package_id', 'id', 'ma']).trim();
      const pkgId = explicitPkgId
        ? explicitPkgId.toLowerCase().replace(/[^a-z0-9_-]/g, '_')
        : ('pkg_' + pkgName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20) + '_' + Math.random().toString(36).slice(2, 6));

      packageMap.set(pkgKey, {
        id: pkgId,
        name: pkgName,
        defaultEquipmentId: defEqId,
        items: [],
        price
      });
    }

    const existing = packageMap.get(pkgKey)!;
    if (defEqId && !existing.defaultEquipmentId) {
      existing.defaultEquipmentId = defEqId;
    }
    if (!existing.items.some(i => i.code === cleanCode)) {
      existing.items.push({ code: cleanCode, equipmentId: eqId || existing.defaultEquipmentId || null });
    }
    if (price > 0 && existing.price === 0) {
      existing.price = price;
    }
  }

  return Array.from(packageMap.values());
}

export const parseExcelPackages = parseExcelTestPackages;
