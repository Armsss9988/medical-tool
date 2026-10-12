import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parseExcelScales } from '../excel/excelScales';

describe('excelScales hardening', () => {
  it('deduplicates and overwrites levels by grade rather than accumulating duplicates', async () => {
    // Create an Excel workbook in memory with duplicated grades for the same scale
    const rows = [
      {
        'Tên Thang Đo (*)': 'Thang Test Trùng Lặp',
        'Loại Thang (*)': 'Xét nghiệm khác',
        'Đơn Vị Đo (*)': 'mIU/mL',
        'Bậc (Grade) (*)': 0,
        'Ngưỡng Min (*)': 0,
        'Ngưỡng Max': 5,
        'Diễn Giải Lâm Sàng (*)': 'Âm tính bản đầu',
        'Trạng Thái (*)': 'Âm tính'
      },
      {
        'Tên Thang Đo (*)': 'Thang Test Trùng Lặp',
        'Loại Thang (*)': 'Xét nghiệm khác',
        'Đơn Vị Đo (*)': 'mIU/mL',
        'Bậc (Grade) (*)': 1,
        'Ngưỡng Min (*)': 5,
        'Ngưỡng Max': 25,
        'Diễn Giải Lâm Sàng (*)': 'Vùng xám',
        'Trạng Thái (*)': 'Dương tính'
      },
      // Duplicate grade 0 with updated text (should overwrite, not append)
      {
        'Tên Thang Đo (*)': 'Thang Test Trùng Lặp',
        'Loại Thang (*)': 'Xét nghiệm khác',
        'Đơn Vị Đo (*)': 'mIU/mL',
        'Bậc (Grade) (*)': 0,
        'Ngưỡng Min (*)': 0,
        'Ngưỡng Max': 5,
        'Diễn Giải Lâm Sàng (*)': 'Âm tính đã cập nhật',
        'Trạng Thái (*)': 'Âm tính'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Thang Đo');
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const scales = await parseExcelScales(buf);
    expect(scales).toHaveLength(1);
    const scale = scales[0];
    expect(scale.name).toBe('Thang Test Trùng Lặp');
    expect(scale.scaleType).toBe('Xét nghiệm khác');
    // Crucial check: Must have exactly 2 levels (grades 0 and 1), NOT 3!
    expect(scale.levels).toHaveLength(2);
    expect(scale.levels.find((l) => l.grade === 0)?.label).toBe('Âm tính đã cập nhật');
  });

  it('correctly parses Loại Thang column and detects Allergen vs General scales', async () => {
    const rows = [
      {
        'Tên Thang Đo (*)': 'Protia Dị Nguyên Test',
        'Loại Thang (*)': 'Dị nguyên',
        'Đơn Vị Đo (*)': 'IU/mL',
        'Bậc (Grade) (*)': 0,
        'Ngưỡng Min (*)': 0,
        'Ngưỡng Max': 0.34,
        'Diễn Giải Lâm Sàng (*)': 'Âm tính'
      },
      {
        'Tên Thang Đo (*)': 'GL – HBV DNA',
        'Loại Thang (*)': 'Xét nghiệm khác',
        'Đơn Vị Đo (*)': 'IU/mL',
        'Bậc (Grade) (*)': 0,
        'Ngưỡng Min (*)': 0,
        'Ngưỡng Max': 20,
        'Diễn Giải Lâm Sàng (*)': 'Dưới ngưỡng'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Thang Đo');
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const scales = await parseExcelScales(buf);
    expect(scales).toHaveLength(2);

    const allergen = scales.find((s) => s.name === 'Protia Dị Nguyên Test');
    expect(allergen?.scaleType).toBe('Dị nguyên');

    const general = scales.find((s) => s.name === 'GL – HBV DNA');
    expect(general?.scaleType).toBe('Xét nghiệm khác');
  });
});
