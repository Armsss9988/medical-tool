// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RevenueKpiSkeleton, InvoiceTableSkeleton } from '../RevenueSkeleton';

describe('RevenueSkeleton Components', () => {
  it('renders 6 pulse items in RevenueKpiSkeleton', () => {
    render(<RevenueKpiSkeleton />);
    const kpiContainer = screen.getByTestId('revenue-kpi-skeleton');
    expect(kpiContainer).toBeTruthy();
    expect(kpiContainer.children.length).toBe(6);
  });

  it('renders table skeleton with specified rows in InvoiceTableSkeleton', () => {
    const { container } = render(<InvoiceTableSkeleton rowsCount={5} />);
    expect(screen.getByTestId('invoice-table-skeleton')).toBeTruthy();
    expect(screen.getByText(/Đang tải dữ liệu sổ sách hóa đơn & doanh thu/i)).toBeTruthy();

    const tbody = container.querySelector('tbody');
    expect(tbody).not.toBeNull();
    const rows = tbody?.querySelectorAll('tr');
    expect(rows?.length).toBe(5);
  });
});
