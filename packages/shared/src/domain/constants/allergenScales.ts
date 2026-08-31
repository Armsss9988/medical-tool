import { AllergenGradingScale } from '../types';
import { normalizeAllergenScale } from '../allergen';

export function getAllergenScaleById(id?: string, customScales?: AllergenGradingScale[]): AllergenGradingScale | undefined {
  if (!customScales || customScales.length === 0) {
    return undefined;
  }
  const found = (!id ? customScales[0] : customScales.find((s) => s.id === id) || customScales[0]);
  return normalizeAllergenScale(found);
}

