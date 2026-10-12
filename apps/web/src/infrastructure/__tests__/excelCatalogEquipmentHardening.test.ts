import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parseExcelCatalogItemEquipments } from '../excel/excelCatalog';
import type { CatalogItem, TestEquipment, AllergenGradingScale } from '@domain/types';

describe('excelCatalog item equipments hardening', () => {
  const mockItems: CatalogItem[] = [
    { code: 'GLU', name: 'Glucose', category: 'Sinh Hóa', price: 50000, evaluationType: 'range', refMin: 3.9, refMax: 6.4, unit: 'mmol/L', refText: '3,9 - 6,4' },
    { code: 'BHCG', name: 'Beta-hCG', category: 'Miễn dịch', price: 150000, evaluationType: 'scale', scaleId: 'scale_beta_hcg', unit: 'mIU/mL', refText: '< 5' },
    { code: 'd1', name: 'Bụi nhà d1', category: 'Dị Nguyên Hô Hấp', price: 200000, evaluationType: 'scale', scaleId: 'scale_protia_91', unit: 'IU/mL', refText: '< 0,34' },
    { code: 'HPDADAY', name: 'Test vi khuẩn HP hơi thở C14', category: 'Thăm dò chức năng', price: 400000, evaluationType: 'range', unit: 'DPM', refText: '< 50' }
  ];

  const mockEquipments: TestEquipment[] = [
    { id: 'eq_ms360', name: 'Máy Sinh Hóa Tự Động MS-360', code: 'MS360' },
    { id: 'eq_urea_c14', name: 'Máy đo hơi thở Urea C14 (H. pylori)', code: 'C14' },
    { id: 'eq_protia', name: 'Máy Đọc Dị Nguyên PROTIA Smart Analyzer', code: 'PROTIA' }
  ];

  const mockScales: AllergenGradingScale[] = [
    { id: 'scale_protia_91', name: 'Protia 91 (Độ 0-6)', scaleType: 'Dị nguyên', unit: 'IU/mL', levels: [] },
    { id: 'scale_beta_hcg', name: 'Beta-hCG (mIU/mL)', scaleType: 'Xét nghiệm khác', unit: 'mIU/mL', levels: [] }
  ];

  it('rejects garbage machine names like UUIDs or eq_eq_', async () => {
    const rows = [
      {
        'Mã chỉ số (*)': 'HPDADAY',
        'Tên máy đo (*)': 'f3ba2e15-7764-4e4b-b0b3-96b02ca43058',
        'Đặt làm mặc định': 'Có'
      },
      {
        'Mã chỉ số (*)': 'HPDADAY',
        'Tên máy đo (*)': 'Máy đo hơi thở Urea C14 (H. pylori)',
        'Đặt làm mặc định': 'Có'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cấu Hình');
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const links = await parseExcelCatalogItemEquipments(buf, mockItems, mockEquipments, mockScales);
    expect(links).toHaveLength(1);
    expect(links[0].catalogCode).toBe('HPDADAY');
    expect(links[0].equipmentId).toBe('eq_urea_c14');
  });

  it('ensures exactly 1 default machine link per test code when multiple lines are uploaded', async () => {
    const rows = [
      {
        'Mã chỉ số (*)': 'GLU',
        'Tên máy đo (*)': 'Máy Sinh Hóa Tự Động MS-360',
        'Đặt làm mặc định': 'Có'
      },
      {
        'Mã chỉ số (*)': 'GLU',
        'Tên máy đo (*)': 'Máy Đọc Dị Nguyên PROTIA Smart Analyzer',
        'Đặt làm mặc định': 'Có'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cấu Hình');
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const links = await parseExcelCatalogItemEquipments(buf, mockItems, mockEquipments, mockScales);
    expect(links).toHaveLength(2);
    const defaultLinks = links.filter((l) => l.catalogCode === 'GLU' && l.isDefault);
    expect(defaultLinks).toHaveLength(1);
    // The second (later) one was set to 'Có', so it should be the default
    expect(links[1].isDefault).toBe(true);
    expect(links[0].isDefault).toBe(false);
  });

  it('blocks cross-assignment of allergen scale to non-allergen indicator', async () => {
    const rows = [
      {
        'Mã chỉ số (*)': 'GLU', // Sinh Hóa
        'Tên máy đo (*)': 'Máy Sinh Hóa Tự Động MS-360',
        'Kiểu đánh giá (*)': 'Thang phân độ',
        'Thang đo phân độ': 'Protia 91 (Độ 0-6)', // Allergen scale!
        'Đặt làm mặc định': 'Có'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cấu Hình');
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const links = await parseExcelCatalogItemEquipments(buf, mockItems, mockEquipments, mockScales);
    expect(links).toHaveLength(1);
    // Allergen scale must not be assigned to GLU
    expect(links[0].scaleId).toBeUndefined();
  });
});
