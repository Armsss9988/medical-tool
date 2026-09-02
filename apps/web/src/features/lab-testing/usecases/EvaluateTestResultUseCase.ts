import { SelectedTest, CatalogItem, CatalogItemEquipmentLink, ReferenceRangeItem, AllergenGradingScale } from '@domain/types';
import { evaluateTestIndicator } from '@domain/testResult';
import { resolveIndicatorReference } from '@domain/services/itemResolver';

export class EvaluateTestResultUseCase {
  public execute(
    selectedTests: SelectedTest[],
    _catalog?: CatalogItem[],
    options?: {
      catalogItemEquipments?: CatalogItemEquipmentLink[];
      referenceRanges?: ReferenceRangeItem[];
      allergenScales?: AllergenGradingScale[];
    }
  ): SelectedTest[] {
    return selectedTests.map((test) => {
      const resolved = resolveIndicatorReference(test, {
        equipmentId: test.equipmentId,
        catalogItemEquipments: options?.catalogItemEquipments,
        referenceRanges: options?.referenceRanges,
        allergenScales: options?.allergenScales
      });

      const evalRes = evaluateTestIndicator(
        test.code,
        test.category,
        resolved.unit,
        test.result,
        resolved.refMin,
        resolved.refMax,
        resolved.scale
      );

      return {
        ...test,
        refMin: resolved.refMin,
        refMax: resolved.refMax,
        refText: resolved.refText,
        unit: resolved.unit,
        note: evalRes.label || test.note
      };
    });
  }
}
