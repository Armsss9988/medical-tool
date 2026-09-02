import { AllergenGradingScale } from '../types';
import { normalizeAllergenScale } from '../allergen';

export function getAllergenScaleById(id?: string, customScales?: AllergenGradingScale[]): AllergenGradingScale | undefined {
  if (customScales && customScales.length > 0) {
    const found = id ? customScales.find((s) => s.id === id) : customScales[0];
    if (found) return normalizeAllergenScale(found);
  }
  return undefined;
}

