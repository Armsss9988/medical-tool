// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CatalogTableSkeleton } from '../CatalogTableSkeleton';

describe('CatalogTableSkeleton', () => {
  it('renders skeleton container and loading message', () => {
    render(<CatalogTableSkeleton rowsCount={6} />);

    expect(screen.getByTestId('catalog-table-skeleton')).toBeTruthy();
    expect(screen.getByText(/Đang nạp dữ liệu danh mục xét nghiệm/i)).toBeTruthy();
  });

  it('renders the configured number of rows', () => {
    const { container } = render(<CatalogTableSkeleton rowsCount={4} />);
    const tbody = container.querySelector('tbody');
    expect(tbody).not.toBeNull();
    const rows = tbody?.querySelectorAll('tr');
    expect(rows?.length).toBe(4);
  });
});
