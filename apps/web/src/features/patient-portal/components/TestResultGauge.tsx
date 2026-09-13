'use client';

import { PortalTestItem } from '../types';
import { ClinicalGauge } from '@components/clinical';

interface TestResultGaugeProps {
  test: PortalTestItem;
  className?: string;
}

export default function TestResultGauge({ test, className = '' }: TestResultGaugeProps) {
  return (
    <ClinicalGauge
      result={test.result}
      refMin={test.refMin}
      refMax={test.refMax}
      evaluationType={test.evaluationType}
      scaleId={test.scaleId}
      note={test.note}
      unit={test.unit}
      className={className}
    />
  );
}
