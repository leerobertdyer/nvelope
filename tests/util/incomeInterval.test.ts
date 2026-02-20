import "../helpers/mockFirebase";
import { describe, it, expect } from "vitest";
import { getIncomeByInterval } from "../../src/util";

describe("getIncomeByInterval", () => {
  it("converts MONTHLY to BIWEEKLY (monthly / 2)", () => {
    expect(getIncomeByInterval("MONTHLY", "BIWEEKLY", 2000)).toBe(1000);
  });

  it("converts MONTHLY to WEEKLY (monthly / 4)", () => {
    expect(getIncomeByInterval("MONTHLY", "WEEKLY", 2000)).toBe(500);
  });

  it("keeps MONTHLY unchanged when new interval is MONTHLY", () => {
    expect(getIncomeByInterval("MONTHLY", "MONTHLY", 2000)).toBe(2000);
  });

  it("converts BIWEEKLY to MONTHLY (biweekly * 2)", () => {
    expect(getIncomeByInterval("BIWEEKLY", "MONTHLY", 1000)).toBe(2000);
  });

  it("converts WEEKLY to MONTHLY (weekly * 4)", () => {
    expect(getIncomeByInterval("WEEKLY", "MONTHLY", 500)).toBe(2000);
  });

  it("returns income unchanged for unsupported new interval", () => {
    expect(getIncomeByInterval("MONTHLY", "YEARLY", 2000)).toBe(2000);
  });
});
