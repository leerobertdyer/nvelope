import "../helpers/mockFirebase";
import { describe, it, expect } from "vitest";
import {
  removeVirtualIdPortion,
  cleanPaymentsForFirebase,
  removeUndefinedValues,
  generateFreshPayment,
} from "../../src/util";
import { payment } from "../helpers/fixtures";

describe("removeVirtualIdPortion", () => {
  it("strips virtual suffix to return original id", () => {
    const p = payment({ id: "pay-abc", interval: "WEEKLY" });
    expect(removeVirtualIdPortion({ ...p, id: "pay-abc-WEEKLY-12345" })).toBe("pay-abc");
  });

  it("returns full id when no interval suffix", () => {
    const p = payment({ id: "pay-1" });
    expect(removeVirtualIdPortion(p)).toBe("pay-1");
  });

  it("handles SPLIT virtual id format", () => {
    const virtualPayment = { ...payment({ id: "rent", interval: "SPLIT" }), id: "rent-SPLIT-1735689600000" };
    expect(removeVirtualIdPortion(virtualPayment)).toBe("rent");
  });
});

describe("removeUndefinedValues", () => {
  it("removes undefined values from object", () => {
    const obj = { a: 1, b: undefined, c: "x" };
    const result = removeUndefinedValues(obj as Record<string, unknown>);
    expect(result).toEqual({ a: 1, c: "x" });
  });
});

describe("cleanPaymentsForFirebase", () => {
  it("returns array of objects with no undefined values", () => {
    const payments = [
      payment({ id: "1", amount: 100 }),
      payment({ id: "2", amount: 50, type: undefined }),
    ];
    const result = cleanPaymentsForFirebase(payments);
    expect(result.length).toBe(2);
    result.forEach((row) => {
      expect(Object.values(row).every((v) => v !== undefined)).toBe(true);
    });
  });
});

describe("generateFreshPayment", () => {
  it("returns payment with valid shape and Timestamp dueDate", () => {
    const p = generateFreshPayment();
    expect(p.id).toBeDefined();
    expect(typeof p.id).toBe("string");
    expect(p.name).toBe("");
    expect(p.amount).toBe(0);
    expect(p.dueDate).toBeDefined();
    expect(p.dueDate.toDate).toBeDefined();
    expect(p.dueDate.toDate()).toBeInstanceOf(Date);
  });
});
