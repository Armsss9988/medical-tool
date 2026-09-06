import { AllergenGrade, ResultStatus } from '../types';
import { assertNever } from '../utils/assertNever';

export type TestEvaluation =
  | {
      readonly kind: 'normal';
      readonly status: 'normal';
      readonly label: string;
      readonly isAbnormal: false;
    }
  | {
      readonly kind: 'low';
      readonly status: 'low';
      readonly label: string;
      readonly isAbnormal: true;
      readonly diff?: number;
    }
  | {
      readonly kind: 'high';
      readonly status: 'high';
      readonly label: string;
      readonly isAbnormal: true;
      readonly diff?: number;
    }
  | {
      readonly kind: 'allergen';
      readonly status: 'normal' | 'high';
      readonly grade: AllergenGrade;
      readonly label: string;
      readonly isAbnormal: boolean;
    };

export class TestEvaluationHelper {
  public static match<T>(
    evaluation: TestEvaluation,
    patterns: {
      normal: (e: Extract<TestEvaluation, { kind: 'normal' }>) => T;
      low: (e: Extract<TestEvaluation, { kind: 'low' }>) => T;
      high: (e: Extract<TestEvaluation, { kind: 'high' }>) => T;
      allergen: (e: Extract<TestEvaluation, { kind: 'allergen' }>) => T;
    }
  ): T {
    switch (evaluation.kind) {
      case 'normal':
        return patterns.normal(evaluation);
      case 'low':
        return patterns.low(evaluation);
      case 'high':
        return patterns.high(evaluation);
      case 'allergen':
        return patterns.allergen(evaluation);
      default:
        return assertNever(evaluation);
    }
  }

  public static toLegacyStatus(evaluation: TestEvaluation): ResultStatus {
    return evaluation.status;
  }
}
