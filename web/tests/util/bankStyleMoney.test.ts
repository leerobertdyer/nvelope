import { describe, it, expect } from "vitest";
import {
  dollarsToCents,
  centsToDollars,
  formatCentsForDisplay,
} from "../../src/util/bankStyleMoney";

describe("dollarsToCents", () => {
  it("converts whole dollars to cents", () => {
    expect(dollarsToCents(12)).toBe(1200);
    expect(dollarsToCents(0)).toBe(0);
  });

  it("converts decimal dollars to cents (rounded)", () => {
    expect(dollarsToCents(12.34)).toBe(1234);
    expect(dollarsToCents(0.01)).toBe(1);
    expect(dollarsToCents(0.12)).toBe(12);
    expect(dollarsToCents(1.23)).toBe(123);
  });

  it("rounds to avoid float drift", () => {
    expect(dollarsToCents(0.1 + 0.02)).toBe(12);
  });

  it("handles negative dollars", () => {
    expect(dollarsToCents(-12.34)).toBe(-1234);
  });

  it("rounds fractional cents using Math.round (half away from zero)", () => {
    expect(dollarsToCents(12.345)).toBe(1235); // 1234.5 → 1235
    expect(dollarsToCents(12.334)).toBe(1233);
  });
});

describe("centsToDollars", () => {
  it("converts cents to dollars", () => {
    expect(centsToDollars(1234)).toBe(12.34);
    expect(centsToDollars(1)).toBe(0.01);
    expect(centsToDollars(0)).toBe(0);
  });

  it("handles negative cents", () => {
    expect(centsToDollars(-1234)).toBe(-12.34);
  });
});

describe("round-trip (dollars ↔ cents)", () => {
  it("dollars → cents → dollars recovers original (within rounding)", () => {
    const values = [0, 0.01, 12.34, 99.99, 1234.56];
    for (const d of values) {
      expect(centsToDollars(dollarsToCents(d))).toBe(d);
    }
  });

  it("cents → dollars → cents recovers original", () => {
    const values = [0, 1, 1234, -1234];
    for (const c of values) {
      expect(dollarsToCents(centsToDollars(c))).toBe(c);
    }
  });
});

describe("formatCentsForDisplay", () => {
  it("returns empty string for zero", () => {
    expect(formatCentsForDisplay(0)).toBe("");
  });

  it("formats positive cents as dollars string", () => {
    expect(formatCentsForDisplay(1234)).toBe("12.34");
    expect(formatCentsForDisplay(1)).toBe("0.01");
    expect(formatCentsForDisplay(100)).toBe("1.00");
  });

  it("formats negative cents with leading minus", () => {
    expect(formatCentsForDisplay(-1234)).toBe("-12.34");
    expect(formatCentsForDisplay(-1)).toBe("-0.01");
  });
});
