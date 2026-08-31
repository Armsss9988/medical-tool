import { AllergenGradingScale } from '../types';

export function getAllergenScaleById(id?: string, customScales?: AllergenGradingScale[]): AllergenGradingScale | undefined {
  if (!customScales || customScales.length === 0) {
    return undefined;
  }
  if (!id) {
    return customScales[0];
  }
  return customScales.find((s) => s.id === id) || customScales[0];
}
