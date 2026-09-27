import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBatchExcelOperations } from '../useBatchExcelOperations';
import { BatchImportRow, CatalogItem } from '@domain';

describe('useBatchExcelOperations - Selection, Bulk Actions & Row Editing', () => {
  const dummyCatalog: CatalogItem[] = [
    { code: 'GLU', name: 'Glucose', category: 'Sinh Hóa', unit: 'mmol/L', refMin: 3.9, refMax: 6.4, refText: '3.9 - 6.4' }
  ];

  const initialSampleRows: BatchImportRow[] = [
    {
      id: 'row-1',
      patient: {
        code: 'BN-01',
        name: 'NGUYỄN VĂN A',
        dob: '1990',
        gender: 'Nam',
        phone: '0901234567',
        address: 'Hà Nội',
        diagnosis: 'Khám sức khỏe',
        secretToken: 'sec-1'
      },
      selectedTests: [{ ...dummyCatalog[0], result: '5.5', note: 'Bình thường' }],
      conclusion: 'Bình thường',
      doctorName: 'BS. Trần Hoài Long',
      status: 'NEW',
      action: 'CREATE_NEW'
    },
    {
      id: 'row-2',
      patient: {
        code: 'BN-02',
        name: 'TRẦN THỊ B',
        dob: '1992',
        gender: 'Nữ',
        phone: '0912345678',
        address: 'Đà Nẵng',
        diagnosis: 'Khám sức khỏe',
        secretToken: 'sec-2'
      },
      selectedTests: [{ ...dummyCatalog[0], result: '6.0', note: 'Bình thường' }],
      conclusion: 'Bình thường',
      doctorName: 'BS. Trần Hoài Long',
      status: 'DUPLICATE',
      action: 'CREATE_NEW'
    },
    {
      id: 'row-3',
      patient: {
        code: 'BN-03',
        name: 'LÊ VĂN C',
        dob: '1985',
        gender: 'Nam',
        phone: '0987654321',
        address: 'Quảng Bình',
        diagnosis: 'Kiểm tra định kỳ',
        secretToken: 'sec-3'
      },
      selectedTests: [{ ...dummyCatalog[0], result: '7.2', note: 'Tăng' }],
      conclusion: 'Cần theo dõi',
      doctorName: 'BS. Lê Phan Anh',
      status: 'NEW',
      action: 'CREATE_NEW'
    }
  ];

  const setupHook = () => {
    const onBatchImport = vi.fn();
    const showToast = vi.fn();
    const hook = renderHook(() =>
      useBatchExcelOperations({
        catalog: dummyCatalog,
        onBatchImport,
        showToast
      })
    );
    // Seed initial rows
    act(() => {
      hook.result.current.setImportedRows(initialSampleRows);
    });
    return { ...hook, onBatchImport, showToast };
  };

  it('1. Toggles single row selection and selects/deselects all', () => {
    const { result } = setupHook();

    expect(result.current.importedRows.length).toBe(3);
    expect(result.current.selectedRowIds.size).toBe(0);

    // Select row 1
    act(() => {
      result.current.toggleSelectRow('row-1');
    });
    expect(result.current.isRowSelected('row-1')).toBe(true);
    expect(result.current.isRowSelected('row-2')).toBe(false);
    expect(result.current.selectedRowIds.size).toBe(1);

    // Toggle select all displayed
    act(() => {
      result.current.toggleSelectAll(['row-1', 'row-2', 'row-3']);
    });
    expect(result.current.selectedRowIds.size).toBe(3);
    expect(result.current.isRowSelected('row-2')).toBe(true);
    expect(result.current.isRowSelected('row-3')).toBe(true);

    // Toggle select all again should deselect all
    act(() => {
      result.current.toggleSelectAll(['row-1', 'row-2', 'row-3']);
    });
    expect(result.current.selectedRowIds.size).toBe(0);
  });

  it('2. Bulk updates selected rows (doctor, diagnosis, action)', () => {
    const { result, showToast } = setupHook();

    // Select row-1 and row-3
    act(() => {
      result.current.toggleSelectRow('row-1');
      result.current.toggleSelectRow('row-3');
    });

    // Bulk update doctor and diagnosis
    act(() => {
      result.current.bulkUpdateSelectedRows({
        doctorName: 'BS. Nguyễn Thị Thành Trung',
        diagnosis: 'Khám sức khỏe Doanh Nghiệp GoLab',
        action: 'OVERWRITE'
      });
    });

    const rows = result.current.importedRows;
    expect(rows[0].doctorName).toBe('BS. Nguyễn Thị Thành Trung');
    expect(rows[0].patient.diagnosis).toBe('Khám sức khỏe Doanh Nghiệp GoLab');
    expect(rows[0].action).toBe('OVERWRITE');

    // row-2 was not selected, should remain untouched
    expect(rows[1].doctorName).toBe('BS. Trần Hoài Long');
    expect(rows[1].patient.diagnosis).toBe('Khám sức khỏe');
    expect(rows[1].action).toBe('CREATE_NEW');

    // row-3 was selected
    expect(rows[2].doctorName).toBe('BS. Nguyễn Thị Thành Trung');
    expect(rows[2].action).toBe('OVERWRITE');

    expect(showToast).toHaveBeenCalledWith(expect.stringContaining('Đã cập nhật hàng loạt'), 'success');
  });

  it('3. Bulk deletes selected rows', () => {
    const { result, showToast } = setupHook();

    // Select row-2
    act(() => {
      result.current.toggleSelectRow('row-2');
    });

    act(() => {
      result.current.bulkDeleteSelectedRows();
    });

    expect(result.current.importedRows.length).toBe(2);
    expect(result.current.importedRows.map((r) => r.id)).toEqual(['row-1', 'row-3']);
    expect(result.current.selectedRowIds.size).toBe(0);
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining('Đã xóa 1 bản ghi'), 'info');
  });

  it('4. Updates a single row and deletes a single row', () => {
    const { result } = setupHook();

    // Update row-1 name
    const updatedRow = {
      ...result.current.importedRows[0],
      patient: {
        ...result.current.importedRows[0].patient,
        name: 'NGUYỄN VĂN A VIP'
      }
    };

    act(() => {
      result.current.updateRow('row-1', updatedRow);
    });

    expect(result.current.importedRows[0].patient.name).toBe('NGUYỄN VĂN A VIP');

    // Delete row-3
    act(() => {
      result.current.deleteRow('row-3');
    });

    expect(result.current.importedRows.length).toBe(2);
    expect(result.current.importedRows.find((r) => r.id === 'row-3')).toBeUndefined();
  });
});
