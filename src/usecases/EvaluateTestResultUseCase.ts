import { SelectedTest, CatalogItem } from '../domain/types';
import { evaluateResult } from '../domain/testResult';

export class EvaluateTestResultUseCase {
  public execute(
    selectedTests: SelectedTest[],
    catalog: CatalogItem[]
  ): SelectedTest[] {
    const catalogMap = new Map<string, CatalogItem>();
    catalog.forEach((item) => catalogMap.set(item.code, item));

    return selectedTests.map((test) => {
      const catItem = catalogMap.get(test.code);
      if (!catItem) return test;

      const evalRes = evaluateResult(
        test.result,
        catItem.refMin ?? null,
        catItem.refMax ?? null
      );

      return {
        ...test,
        note: evalRes.label
      };
    });
  }
}
