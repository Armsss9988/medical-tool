import { describe, it, expect } from 'vitest';
import ExcelJS from 'exceljs';
import { parseExcelCatalog, parseExcelCatalogItemEquipments } from '../excel/excelCatalog';
import type { TestEquipment, AllergenGradingScale, CatalogItem } from '@domain/types';

describe('Task 1: Excel Catalog Import Hardening', () => {
  const mockEquipments: TestEquipment[] = [
    { id: 'eq_ms360', name: 'Máy Sinh Hóa Tự Động MS-360', code: 'MS-360' },
    { id: 'eq_c14', name: 'Máy đo hơi thở Urea C14 (H. pylori)', code: 'C14' }
  ];

  const mockScales: AllergenGradingScale[] = [
    { id: 'scale_protia_91', name: 'Protia 91 (Độ 0-6)', unit: 'IU/mL', levels: [] }
  ];

  const mockCatalog: CatalogItem[] = [
    { code: 'C3/C2', name: 'Tỷ lệ C3/C2', category: 'Sàng lọc sơ sinh', unit: '', refText: '< 0.25' },
    { code: 'SS55_01', name: 'Bệnh thiếu Phenylalanine hydroxylase (PKU)', category: 'Sàng lọc sơ sinh', unit: '', refText: '' }
  ];

  it('preserves empty Min, Max, and Unit as null / empty string and never assigns 14 or 15', async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Chỉ số');
    ws.addRow(['STT', 'Mã chỉ số', 'Tên chỉ số', 'Nhóm xét nghiệm', 'Tên khoa học / Allergen', 'Đơn vị', 'Kiểu đánh giá', 'Ngưỡng Min', 'Ngưỡng Max']);
    // Empty min, max, unit
    ws.addRow([1, 'C3/C2', 'Tỷ lệ C3/C2', 'Sàng lọc sơ sinh', '', '', 'Khoảng số', '', '']);
    // Normal numeric min/max
    ws.addRow([2, 'GLU', 'Glucose máu', 'Sinh Hóa', 'Blood Glucose', 'mmol/L', 'Khoảng số', '3.9', '6.4']);

    const buf = await wb.xlsx.writeBuffer();
    const items = await parseExcelCatalog(buf);

    expect(items).toHaveLength(2);
    const c3c2 = items.find((i) => i.code === 'C3/C2');
    expect(c3c2).toBeDefined();
    expect(c3c2?.refMin).toBeNull();
    expect(c3c2?.refMax).toBeNull();
    expect(c3c2?.unit).toBe('');
    expect(c3c2?.scientific).toBeUndefined();

    const glu = items.find((i) => i.code === 'GLU');
    expect(glu).toBeDefined();
    expect(glu?.refMin).toBe(3.9);
    expect(glu?.refMax).toBe(6.4);
    expect(glu?.unit).toBe('mmol/L');
  });

  it('auto-populates SS55_* reference text from scientific column and sets evaluationType to text', async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Chỉ số');
    ws.addRow(['STT', 'Mã chỉ số', 'Tên chỉ số', 'Nhóm xét nghiệm', 'Tên khoa học / Allergen', 'Đơn vị', 'Kiểu đánh giá', 'Ngưỡng Min', 'Ngưỡng Max', 'Tham chiếu hiển thị (chữ)']);
    ws.addRow([1, 'SS55_01', 'Bệnh thiếu hụt carnitine palmitoyltransferase IA', 'Sàng lọc 55 bệnh', 'C0 < 9,0', '', '', '', '', '']);
    ws.addRow([2, 'SS55_02', 'Bệnh thiếu carnitine-acylcarnitine translocase', 'Sàng lọc 55 bệnh', 'C16 > 6,20', '', '', '', '', '']);

    const buf = await wb.xlsx.writeBuffer();
    const items = await parseExcelCatalog(buf);

    expect(items).toHaveLength(2);
    const ss1 = items.find((i) => i.code === 'SS55_01');
    expect(ss1?.evaluationType).toBe('text');
    expect(ss1?.refText).toBe('C0 < 9,0');
    expect(ss1?.refMin).toBeNull();
    expect(ss1?.refMax).toBeNull();

    const ss2 = items.find((i) => i.code === 'SS55_02');
    expect(ss2?.evaluationType).toBe('text');
    expect(ss2?.refText).toBe('C16 > 6,20');
  });

  it('rejects unknown machine names in parseExcelCatalogItemEquipments and preserves null thresholds', async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Cấu hình');
    ws.addRow(['STT', 'Mã chỉ số', 'Tên máy đo', 'Đơn vị', 'Kiểu đánh giá', 'Ngưỡng Min', 'Ngưỡng Max', 'Đặt làm mặc định']);
    // Valid machine
    ws.addRow([1, 'GLU', 'Máy Sinh Hóa Tự Động MS-360', '', 'Khoảng số', '', '', 'Có']);
    // Unknown/garbage UUID machine
    ws.addRow([2, 'HPDADAY', 'f3ba2e15-7764-4e4b-b0b3-96b02ca43058', 'DPM', 'Khoảng số', '0', '50', 'Có']);
    // Random unrecognized machine
    ws.addRow([3, 'GLU', 'Máy Lạ Chưa Đăng Ký', 'mmol/L', 'Khoảng số', '3.9', '6.4', 'Không']);

    const buf = await wb.xlsx.writeBuffer();
    const links = await parseExcelCatalogItemEquipments(buf, mockCatalog, mockEquipments, mockScales);

    // Only GLU with Máy Sinh Hóa Tự Động MS-360 should be accepted
    expect(links).toHaveLength(1);
    expect(links[0].catalogCode).toBe('GLU');
    expect(links[0].equipmentId).toBe('eq_ms360');
    expect(links[0].refMin).toBeNull();
    expect(links[0].refMax).toBeNull();
    expect(links[0].unit).toBeUndefined();
  });
});
