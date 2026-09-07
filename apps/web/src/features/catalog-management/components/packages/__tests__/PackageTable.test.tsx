// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { PackageTable } from '../PackageTable';
import { CatalogItem, TestPackage, TestEquipment } from '@domain/types';

describe('PackageTable - Default Values & Checkbox Options', () => {
  afterEach(() => {
    cleanup();
  });

  const mockItems: CatalogItem[] = [
    {
      code: 'GLU',
      name: 'Glucose Máu',
      category: 'Sinh Hóa',
      unit: 'mmol/L',
      refMin: 3.9,
      refMax: 6.4,
      refText: '3.9 - 6.4',
      price: 35000,
      evaluationType: 'range'
    },
    {
      code: 'HBSAG',
      name: 'HBsAg Test Nhanh',
      category: 'Miễn Dịch',
      unit: '',
      refMin: null,
      refMax: null,
      refText: 'Âm tính',
      price: 60000,
      evaluationType: 'text'
    }
  ];

  const mockPackages: TestPackage[] = [
    {
      id: 'pkg_general',
      name: 'Gói Khám Tổng Quát',
      price: 90000,
      items: [
        { code: 'GLU', orderIndex: 1, defaultValue: '5.0', hasDefaultValue: true },
        { code: 'HBSAG', orderIndex: 2, defaultValue: null, hasDefaultValue: false }
      ]
    }
  ];

  const mockEquipments: TestEquipment[] = [
    { id: 'eq_ms360', name: 'MS-360', code: 'MS-360' }
  ];

  it('renders package items with defaultValue inputs and hasDefaultValue checkboxes', () => {
    render(
      <PackageTable
        items={mockItems}
        packages={mockPackages}
        setPackages={vi.fn()}
        equipments={mockEquipments}
      />
    );

    expect(screen.getByText('KQ Mặc Định')).toBeTruthy();
    expect(screen.getByDisplayValue('5.0')).toBeTruthy();

    const checkboxes = screen.getAllByRole('checkbox');
    // First item GLU has hasDefaultValue: true
    expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);
    // Second item HBSAG has hasDefaultValue: false
    expect((checkboxes[1] as HTMLInputElement).checked).toBe(false);
  });

  it('updates defaultValue and automatically toggles hasDefaultValue when typing in input', () => {
    const setPackages = vi.fn();
    render(
      <PackageTable
        items={mockItems}
        packages={mockPackages}
        setPackages={setPackages}
        equipments={mockEquipments}
      />
    );

    const inputs = screen.getAllByPlaceholderText('VD: Âm tính, 0...');
    expect(inputs.length).toBe(2);

    // Type in HBSAG default value input
    fireEvent.change(inputs[1], { target: { value: 'Âm tính' } });

    expect(setPackages).toHaveBeenCalled();
    const updateFn = setPackages.mock.calls[0][0];
    const updatedPkgs = updateFn(mockPackages);
    expect(updatedPkgs[0].items[1].defaultValue).toBe('Âm tính');
    expect(updatedPkgs[0].items[1].hasDefaultValue).toBe(true);
  });

  it('toggles hasDefaultValue checkbox on and off', () => {
    const setPackages = vi.fn();
    render(
      <PackageTable
        items={mockItems}
        packages={mockPackages}
        setPackages={setPackages}
        equipments={mockEquipments}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    // Uncheck GLU checkbox
    fireEvent.click(checkboxes[0]);

    expect(setPackages).toHaveBeenCalled();
    const updateFn = setPackages.mock.calls[0][0];
    const updatedPkgs = updateFn(mockPackages);
    expect(updatedPkgs[0].items[0].hasDefaultValue).toBe(false);
  });

  it('supports "Mẫu KQ Chuẩn Cho Gói" batch auto-fill button', () => {
    const setPackages = vi.fn();
    const showToast = vi.fn();
    render(
      <PackageTable
        items={mockItems}
        packages={mockPackages}
        setPackages={setPackages}
        equipments={mockEquipments}
        showToast={showToast}
      />
    );

    const batchBtn = screen.getByText('Mẫu KQ Chuẩn Cho Gói');
    fireEvent.click(batchBtn);

    expect(setPackages).toHaveBeenCalled();
    const updateFn = setPackages.mock.calls[0][0];
    const updatedPkgs = updateFn(mockPackages);
    // GLU has range 3.9 - 6.4 => midpoint ~ 5.2
    expect(updatedPkgs[0].items[0].defaultValue).toBe('5.2');
    expect(updatedPkgs[0].items[0].hasDefaultValue).toBe(true);
    // HBSAG has text "Âm tính"
    expect(updatedPkgs[0].items[1].defaultValue).toBe('Âm tính');
    expect(updatedPkgs[0].items[1].hasDefaultValue).toBe(true);
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining('Đã tự động điền mẫu KQ chuẩn'), 'success');
  });

  it('supports toggling all default values via header button', () => {
    const setPackages = vi.fn();
    const showToast = vi.fn();
    render(
      <PackageTable
        items={mockItems}
        packages={mockPackages}
        setPackages={setPackages}
        equipments={mockEquipments}
        showToast={showToast}
      />
    );

    // Not all checked, header shows "bật hết"
    const toggleAllBtn = screen.getByTitle('Bật / Tắt tất cả tùy chọn kết quả mặc định trong gói');
    fireEvent.click(toggleAllBtn);

    expect(setPackages).toHaveBeenCalled();
    const updateFn = setPackages.mock.calls[0][0];
    const updatedPkgs = updateFn(mockPackages);
    expect(updatedPkgs[0].items.every((i: { hasDefaultValue?: boolean }) => i.hasDefaultValue)).toBe(true);
  });
});
