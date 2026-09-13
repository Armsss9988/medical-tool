import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ClinicalResultsTable, ClinicalTestRowData } from '../ClinicalResultsTable';

describe('ClinicalResultsTable', () => {
  afterEach(() => {
    cleanup();
  });

  const sampleTests: ClinicalTestRowData[] = [
    {
      testCode: 'WBC',
      testName: 'Số lượng bạch cầu',
      category: 'Huyết học',
      result: '7.5',
      unit: 'G/L',
      refMin: 4.0,
      refMax: 10.0,
      refText: '4.0 - 10.0',
      note: 'Bình thường',
      evaluation: 'NORMAL'
    },
    {
      testCode: 'GLU',
      testName: 'Đường huyết đói (Glucose)',
      category: 'Sinh hóa',
      result: '7.8',
      unit: 'mmol/L',
      refMin: 3.9,
      refMax: 6.4,
      refText: '3.9 - 6.4',
      note: 'Vượt ngưỡng',
      evaluation: 'ABNORMAL'
    }
  ];

  it('renders clinical panels and categorized test rows', () => {
    render(<ClinicalResultsTable tests={sampleTests} />);

    expect(screen.getByText('Huyết học')).toBeDefined();
    expect(screen.getByText('Sinh hóa')).toBeDefined();
    expect(screen.getAllByText('Số lượng bạch cầu').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Đường huyết đói (Glucose)').length).toBeGreaterThan(0);
    expect(screen.getAllByText('7.5').length).toBeGreaterThan(0);
    expect(screen.getAllByText('7.8').length).toBeGreaterThan(0);
  });

  it('expands detail accordion on row click', () => {
    render(<ClinicalResultsTable tests={sampleTests} />);

    // Click desktop row for Glucose
    const glucoseMatches = screen.getAllByText('Đường huyết đói (Glucose)');
    const desktopRow = glucoseMatches[0].closest('tr');
    if (desktopRow) {
      fireEvent.click(desktopRow);
      expect(screen.getByText(/Phân tích sinh học chi tiết/i)).toBeDefined();
    }
  });

  it('renders empty state when no tests match filter', () => {
    render(<ClinicalResultsTable tests={[]} />);
    expect(screen.getByText(/Không có chỉ số nào phù hợp/i)).toBeDefined();
  });

  it('renders pending test with waiting indicators instead of normal badge', () => {
    const pendingTests: ClinicalTestRowData[] = [
      {
        testCode: 'UREA',
        testName: 'Định lượng Urea máu',
        category: 'Sinh hóa',
        result: '',
        unit: 'mmol/L',
        refMin: 2.5,
        refMax: 7.5,
        evaluation: 'PENDING'
      }
    ];

    const { queryAllByText } = render(<ClinicalResultsTable tests={pendingTests} />);
    expect(screen.getAllByText('Đang chờ').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Chờ KQ').length).toBeGreaterThan(0);
    // Badges must not have 'Chuẩn'
    const normalBadges = queryAllByText('Chuẩn').filter((el) =>
      el.closest('[data-testid="clinical-badge"]')
    );
    expect(normalBadges.length).toBe(0);
  });
});
