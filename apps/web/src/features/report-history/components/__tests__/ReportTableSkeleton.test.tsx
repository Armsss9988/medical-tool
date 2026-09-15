// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportTableSkeleton } from '../ReportTableSkeleton';

describe('ReportTableSkeleton', () => {
  it('renders skeleton container and loading message', () => {
    render(<ReportTableSkeleton rowsCount={6} />);

    expect(screen.getByTestId('report-table-skeleton')).toBeTruthy();
    expect(screen.getByText(/Đang tải danh sách hồ sơ phiếu khám/i)).toBeTruthy();
  });

  it('renders specified number of skeleton rows in desktop table', () => {
    const { container } = render(<ReportTableSkeleton rowsCount={8} />);
    const tbody = container.querySelector('tbody');
    expect(tbody).not.toBeNull();
    const rows = tbody?.querySelectorAll('tr');
    expect(rows?.length).toBe(8);
  });
});
