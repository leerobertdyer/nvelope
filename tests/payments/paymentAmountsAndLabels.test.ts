import "../helpers/mockFirebase";
import { describe, it, expect } from "vitest";
import {
  getEffectivePaymentAmount,
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
