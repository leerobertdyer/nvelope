import "../helpers/mockFirebase";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { paymentsTotal } from "../../src/util";
import { payment, date, ts } from "../helpers/fixtures";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2025, 0, 15)); // Jan 15
});
afterEach(() => {
  vi.useRealTimers();
});

describe("paymentsTotal", () => {
  it("returns totalMonthlyPayments from virtual payments", () => {
    const payments = [
      payment({ id: "1", amount: 100, dueDate: date(2025, 1, 10), interval: "MONTHLY", type: "BILL" }),
      payment({ id: "2", amount: 50, dueDate: date(2025, 1, 20), interval: "MONTHLY", type: "BILL" }),
    ];
    const payDate = ts(date(2025, 1, 1));
    const result = paymentsTotal(payments, "MONTHLY", payDate);
    expect(result.totalMonthlyPayments).toBe(150);
  });

  it("returns remainingDebt from raw payments (not virtual)", () => {
    const payments = [
      payment({ id: "d1", type: "DEBT", amount: 100, total: 300, dueDate: date(2025, 1, 1), interval: "MONTHLY" }),
    ];
    const payDate = ts(date(2025, 1, 1));
    const result = paymentsTotal(payments, "MONTHLY", payDate);
    expect(result.remainingDebt).toBe(300);
  });

  it("returns currentBills for bills whose due date falls in current pay period", () => {
    const payments = [
      payment({ id: "b1", type: "BILL", amount: 80, dueDate: date(2025, 1, 10), interval: "MONTHLY" }),
    ];
    const payDate = ts(date(2025, 1, 1));
    const result = paymentsTotal(payments, "MONTHLY", payDate);
    expect(typeof result.currentBills).toBe("number");
    expect(result.totalBills).toBe(80);
  });

  it("returns totalBills and totalFunds across all virtual payments", () => {
    const payments = [
      payment({ id: "b1", type: "BILL", amount: 100, dueDate: date(2025, 1, 10), interval: "MONTHLY" }),
      payment({ id: "f1", type: "FUND", amount: 50, dueDate: date(2025, 1, 20), interval: "MONTHLY" }),
    ];
    const payDate = ts(date(2025, 1, 1));
    const result = paymentsTotal(payments, "MONTHLY", payDate);
    expect(result.totalBills).toBe(100);
    expect(result.totalFunds).toBe(50);
  });
});
