import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClinicalGauge, parseNumericResult } from '../ClinicalGauge';

describe('ClinicalGauge', () => {
  it('parseNumericResult handles various format inputs', () => {
    expect(parseNumericResult('12.5')).toBe(12.5);
    expect(parseNumericResult('12,5')).toBe(12.5);
    expect(parseNumericResult(' > 50 ')).toBe(50);
    expect(parseNumericResult('âm tính')).toBeNull();
    expect(parseNumericResult(undefined)).toBeNull();
  });

  it('renders dual reference range gauge (min-max)', () => {
    render(
      <ClinicalGauge
        result="4.5"
        refMin={3.5}
        refMax={5.5}
        unit="mmol/L"
      />
    );

    expect(screen.getByTestId('range-gauge')).toBeDefined();
    expect(screen.getByText(/Khoảng Chuẩn Y Khoa/i)).toBeDefined();
    expect(screen.getByText(/Min: 3.5/i)).toBeDefined();
    expect(screen.getByText(/Max: 5.5/i)).toBeDefined();
    expect(screen.getByText('4.5 mmol/L')).toBeDefined();
  });

  it('renders cut-off threshold gauge when refMin is 0 or null', () => {
    render(
      <ClinicalGauge
        result="15"
        refMin={0}
        refMax={10}
        unit="U/mL"
      />
    );

    expect(screen.getByTestId('cutoff-gauge')).toBeDefined();
    expect(screen.getByText(/Ngưỡng Cut-off: 10 U\/mL/i)).toBeDefined();
    expect(screen.getByText('Âm tính')).toBeDefined();
    expect(screen.getByText('Dương tính')).toBeDefined();
  });

  it('renders allergen 7-grade scale when evaluationType is scale', () => {
    render(
      <ClinicalGauge
        result="Độ 3"
        evaluationType="scale"
        note="Độ 3"
      />
    );

    expect(screen.getByTestId('allergen-gauge')).toBeDefined();
    expect(screen.getByText(/Độ 3 \(Dị ứng trung bình\)/i)).toBeDefined();
  });
});
