// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import CatalogManagerModal from '../CatalogManagerModal';
import type { CatalogItem, TestPackage } from '@domain';

const mockCatalog: CatalogItem[] = [
  {
    code: 'GLU',
    name: 'Glucose Máu',
    category: 'Sinh Hóa',
    unit: 'mmol/L',
    refText: '3.9 - 6.4',
    price: 40000
  },
  {
    code: 'URE',
    name: 'Ure Máu',
    category: 'Sinh Hóa',
    unit: 'mmol/L',
    refText: '2.5 - 7.5',
    price: 35000
  }
];

const mockPackages: TestPackage[] = [
  {
    id: 'pkg-1',
    name: 'Gói Cơ Bản',
    price: 150000,
    items: [{ code: 'GLU' }, { code: 'URE' }]
  }
];

describe('CatalogManagerModal Data Hydration Lifecycle', () => {
  afterEach(() => {
    cleanup();
  });

  it('automatically hydrates catalog data into UI when loading completes without reopening modal', () => {
    // 1. Initial render: Modal is open, but data is currently in-flight (isLoading = true, catalog = [])
    const { rerender } = render(
      <CatalogManagerModal
        isOpen={true}
        onClose={vi.fn()}
        catalog={[]}
        onSaveCatalog={vi.fn()}
        testPackages={[]}
        onSavePackages={vi.fn()}
        isLoading={true}
      />
    );

    // Skeleton must be visible initially
    expect(screen.getByTestId('catalog-table-skeleton')).toBeTruthy();
    expect(screen.queryByText('Glucose Máu')).toBeNull();

    // 2. Query finishes: rerender with isLoading = false and freshly fetched catalog data
    rerender(
      <CatalogManagerModal
        isOpen={true}
        onClose={vi.fn()}
        catalog={mockCatalog}
        onSaveCatalog={vi.fn()}
        testPackages={mockPackages}
        onSavePackages={vi.fn()}
        isLoading={false}
      />
    );

    // Skeleton must disappear, and freshly arrived items must be immediately visible in the table
    expect(screen.queryByTestId('catalog-table-skeleton')).toBeNull();
    expect(screen.getByText('GLU')).toBeTruthy();
    expect(screen.getByText('Glucose Máu')).toBeTruthy();
    expect(screen.getByText('URE')).toBeTruthy();
    expect(screen.getByText('Ure Máu')).toBeTruthy();
  });

  it('hydrates data when local state was empty and props receive data while open', () => {
    const { rerender } = render(
      <CatalogManagerModal
        isOpen={true}
        onClose={vi.fn()}
        catalog={[]}
        onSaveCatalog={vi.fn()}
        testPackages={[]}
        onSavePackages={vi.fn()}
        isLoading={false}
      />
    );

    expect(screen.queryByText('GLU')).toBeNull();

    // Props suddenly receive items from background sync
    rerender(
      <CatalogManagerModal
        isOpen={true}
        onClose={vi.fn()}
        catalog={mockCatalog}
        onSaveCatalog={vi.fn()}
        testPackages={mockPackages}
        onSavePackages={vi.fn()}
        isLoading={false}
      />
    );

    expect(screen.getByText('GLU')).toBeTruthy();
    expect(screen.getByText('Glucose Máu')).toBeTruthy();
  });

  it('triggers onRefetch callback when clicking the reload button', () => {
    const onRefetchMock = vi.fn();
    render(
      <CatalogManagerModal
        isOpen={true}
        onClose={vi.fn()}
        catalog={mockCatalog}
        onSaveCatalog={vi.fn()}
        testPackages={mockPackages}
        onSavePackages={vi.fn()}
        isLoading={false}
        onRefetch={onRefetchMock}
      />
    );

    const reloadBtn = screen.getByTitle('Tải lại danh mục từ máy chủ');
    expect(reloadBtn).toBeTruthy();
    fireEvent.click(reloadBtn);

    expect(onRefetchMock).toHaveBeenCalledTimes(1);
  });
});
