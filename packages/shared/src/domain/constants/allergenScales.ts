import { AllergenGradingScale } from '../types';

export function getAllergenScaleById(id?: string, customScales?: AllergenGradingScale[]): AllergenGradingScale | undefined {
  if (!id || !customScales || customScales.length === 0) {
    return undefined;
  }
  return customScales.find((s) => s.id === id);
}
