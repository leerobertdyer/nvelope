import "../helpers/mockFirebase";
import { describe, it, expect } from "vitest";
import {
  getEffectivePaymentAmount,
  getBillIntervalLabel,
  getBillMonthlyAmount,
  calculateRemainingDebtPayments,
} from "../../src/util";
import { payment } from "../helpers/fixtures";

describe("getEffectivePaymentAmount", () => {
  it("returns min(amount, total) for DEBT", () => {
    expect(getEffectivePaymentAmount(payment({ type: "DEBT", amount: 100, total: 50 }))).toBe(50);
    expect(getEffectivePaymentAmount(payment({ type: "DEBT", amount: 50, total: 100 }))).toBe(50);
  });

  it("returns amount for BILL", () => {
    expect(getEffectivePaymentAmount(payment({ type: "BILL", amount: 75 }))).toBe(75);
  });
});

describe("getBillIntervalLabel", () => {
  it("returns 'Monthly' for MONTHLY", () => {
    expect(getBillIntervalLabel(payment({ interval: "MONTHLY" }))).toBe("Monthly");
  });
  it("returns 'Biweekly' for BIWEEKLY", () => {
    expect(getBillIntervalLabel(payment({ interval: "BIWEEKLY" }))).toBe("Biweekly");
  });
  it("returns 'Yearly' for YEARLY", () => {
    expect(getBillIntervalLabel(payment({ interval: "YEARLY" }))).toBe("Yearly");
  });
  it("returns 'Split' for SPLIT", () => {
    expect(getBillIntervalLabel(payment({ interval: "SPLIT" }))).toBe("Split");
  });
});

describe("getBillMonthlyAmount", () => {
  it("returns amount for MONTHLY", () => {
    expect(getBillMonthlyAmount(payment({ interval: "MONTHLY", amount: 200 }))).toBe(200);
  });
  it("returns amount * 2 for BIWEEKLY", () => {
    expect(getBillMonthlyAmount(payment({ interval: "BIWEEKLY", amount: 100 }))).toBe(200);
  });
  it("returns amount * (52/12) for WEEKLY", () => {
    expect(getBillMonthlyAmount(payment({ interval: "WEEKLY", amount: 100 }))).toBeCloseTo(100 * (52 / 12));
  });
  it("returns amount / 12 for YEARLY", () => {
    expect(getBillMonthlyAmount(payment({ interval: "YEARLY", amount: 1200 }))).toBe(100);
  });
});

describe("calculateRemainingDebtPayments", () => {
  it("returns ceil(total/amount) for simple debt", () => {
    expect(calculateRemainingDebtPayments(payment({ total: 300, amount: 100 }))).toBe(3);
    expect(calculateRemainingDebtPayments(payment({ total: 350, amount: 100 }))).toBe(4);
  });

  it("returns 1 when remaining balance <= payment amount", () => {
    expect(calculateRemainingDebtPayments(payment({ total: 50, amount: 100 }))).toBe(1);
  });

  it("returns null when total or amount is missing", () => {
    expect(calculateRemainingDebtPayments(payment({ total: 0, amount: 100 }))).toBeNull();
    expect(calculateRemainingDebtPayments(payment({ total: 100, amount: 0 }))).toBeNull();
  });
});
