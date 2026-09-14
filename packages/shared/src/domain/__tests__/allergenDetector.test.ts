import { describe, it, expect } from "vitest";
import {
  isAllergenTest,
  isSpecificAllergenTest,
  hasSpecificAllergenTests,
  hasAllergenTests,
  hasRegularTests,
  hasMixedTests,
  classifyTests,
} from "../allergenDetector";
import type { SelectedTest } from "../types";

describe("allergenDetector domain helpers", () => {
  const regularTest1: SelectedTest = {
    code: "GLU",
    name: "Glucose máu",
    category: "Sinh Hóa",
    unit: "mmol/L",
    result: "5.2",
    note: "",
    refText: "",
  };

  const regularTest2: SelectedTest = {
    code: "WBC",
    name: "Bạch cầu",
    category: "Huyết Học",
    unit: "G/L",
    result: "6.5",
    note: "",
    refText: "",
  };

  const allergenTest1: SelectedTest = {
    code: "d1",
    name: "Mạt bụi nhà",
    category: "60 Dị Nguyên Hô Hấp",
    unit: "IU/mL",
    result: "3.5",
    note: "",
    refText: "",
  };

  const allergenTest2: SelectedTest = {
    code: "f1",
    name: "Lòng trắng trứng",
    category: "60 Dị Nguyên Thực Phẩm",
    unit: "IU/mL",
    result: "0.2",
    note: "",
    refText: "",
  };

  const tIgeTest: SelectedTest = {
    code: "TIgE",
    name: "Tổng nồng độ IgE",
    category: "Dị Nguyên & Miễn Dịch",
    unit: "IU/mL",
    result: "25.0",
    note: "",
    refText: "",
  };

  it("should identify allergen test correctly", () => {
    expect(isAllergenTest(allergenTest1)).toBe(true);
    expect(isAllergenTest(allergenTest2)).toBe(true);
    expect(isAllergenTest(regularTest1)).toBe(false);
    expect(isAllergenTest(regularTest2)).toBe(false);
    // TIgE is part of allergen tests broadly
    expect(isAllergenTest(tIgeTest)).toBe(true);
  });

  it("should distinguish specific allergens from TIgE", () => {
    expect(isSpecificAllergenTest(allergenTest1)).toBe(true);
    expect(isSpecificAllergenTest(allergenTest2)).toBe(true);
    expect(isSpecificAllergenTest(tIgeTest)).toBe(false);
    expect(isSpecificAllergenTest(regularTest1)).toBe(false);
  });

  it("should detect hasSpecificAllergenTests", () => {
    expect(hasSpecificAllergenTests([regularTest1, regularTest2])).toBe(false);
    expect(hasSpecificAllergenTests([tIgeTest])).toBe(false);
    expect(hasSpecificAllergenTests([regularTest1, tIgeTest])).toBe(false);
    expect(hasSpecificAllergenTests([regularTest1, allergenTest1])).toBe(true);
    expect(hasSpecificAllergenTests([allergenTest1, tIgeTest])).toBe(true);
  });

  it("should detect hasAllergenTests (only when specific allergens exist)", () => {
    expect(hasAllergenTests([regularTest1, regularTest2])).toBe(false);
    expect(hasAllergenTests([regularTest1, allergenTest1])).toBe(true);
    expect(hasAllergenTests([allergenTest1, allergenTest2])).toBe(true);
    expect(hasAllergenTests([tIgeTest])).toBe(false);
  });

  it("should detect hasRegularTests", () => {
    expect(hasRegularTests([regularTest1, regularTest2])).toBe(true);
    expect(hasRegularTests([regularTest1, allergenTest1])).toBe(true);
    expect(hasRegularTests([allergenTest1, allergenTest2])).toBe(false);
    expect(hasRegularTests([allergenTest1, tIgeTest])).toBe(false);
  });

  it("should detect hasMixedTests correctly (isolated TIgE does not trigger mixed)", () => {
    expect(hasMixedTests([regularTest1, regularTest2])).toBe(false);
    expect(hasMixedTests([allergenTest1, allergenTest2])).toBe(false);
    expect(hasMixedTests([allergenTest1, tIgeTest])).toBe(false);
    expect(hasMixedTests([regularTest1, allergenTest1])).toBe(true);
    // TIgE alone with regular test does NOT trigger mixed hybrid report
    expect(hasMixedTests([regularTest1, tIgeTest])).toBe(false);
    expect(
      hasMixedTests([regularTest1, regularTest2, allergenTest1, allergenTest2]),
    ).toBe(true);
    expect(
      hasMixedTests([regularTest1, tIgeTest, allergenTest1]),
    ).toBe(true);
  });

  it("should classify tests cleanly when specific allergens are present", () => {
    const mixed = [
      regularTest1,
      regularTest2,
      allergenTest1,
      allergenTest2,
      tIgeTest,
    ];
    const res = classifyTests(mixed);

    expect(res.isMixed).toBe(true);
    expect(res.isAllergenOnly).toBe(false);
    expect(res.isRegularOnly).toBe(false);
    expect(res.regularTests.length).toBe(2);
    expect(res.allergenTests.length).toBe(3);
    expect(res.regularTests.map((t) => t.code)).toEqual(["GLU", "WBC"]);
    expect(res.allergenTests.map((t) => t.code)).toEqual(["d1", "f1", "TIgE"]);
  });

  it("should classify isolated TIgE with regular tests as pure clinical regular", () => {
    const regularWithTige = [regularTest1, regularTest2, tIgeTest];
    const res = classifyTests(regularWithTige);

    expect(res.isMixed).toBe(false);
    expect(res.isAllergenOnly).toBe(false);
    expect(res.isRegularOnly).toBe(true);
    expect(res.allergenTests.length).toBe(0);
    expect(res.regularTests.length).toBe(3);
    expect(res.regularTests.map((t) => t.code)).toEqual(["GLU", "WBC", "TIgE"]);
  });
});
