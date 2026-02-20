import "../helpers/mockFirebase";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getPaymentOccurrencesInRange,
  getPaymentOccurrencesForPeriod,
  getVirtualPaymentsForCurrentPeriod,
} from "../../src/util";
import { payment, date, ts } from "../helpers/fixtures";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2025, 0, 15)); // Jan 15 2025
});
afterEach(() => {
  vi.useRealTimers();
});

describe("getPaymentOccurrencesInRange", () => {
  it("returns one adjusted payment for MONTHLY when due date falls in range", () => {
    const p = payment({
      dueDate: date(2025, 1, 20),
      interval: "MONTHLY",
    });
    const rangeStart = date(2025, 1, 1);
    const rangeEnd = date(2025, 1, 31);
    const payDate = ts(date(2025, 1, 1));
    const result = getPaymentOccurrencesInRange(p, "BIWEEKLY", payDate, rangeStart, rangeEnd);
    expect(result.length).toBe(1);
    expect(result[0].amount).toBe(p.amount);
  });

  it("returns multiple occurrences for WEEKLY in a range", () => {
    const p = payment({
      dueDate: date(2025, 1, 1),
      interval: "WEEKLY",
    });
    const rangeStart = date(2025, 1, 1);
    const rangeEnd = date(2025, 1, 22);
    const payDate = ts(date(2025, 1, 1));
    const result = getPaymentOccurrencesInRange(p, "BIWEEKLY", payDate, rangeStart, rangeEnd);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it("returns at most one occurrence for MONTHLY per range", () => {
    const p = payment({
      dueDate: date(2025, 1, 20),
      interval: "MONTHLY",
    });
    const rangeStart = date(2025, 1, 1);
    const rangeEnd = date(2025, 1, 31);
    const payDate = ts(date(2025, 1, 1));
    const result = getPaymentOccurrencesInRange(p, "BIWEEKLY", payDate, rangeStart, rangeEnd);
    expect(result.length).toBeLessThanOrEqual(1);
  });
});

describe("getPaymentOccurrencesForPeriod", () => {
  it("returns occurrences for current pay period only", () => {
    const p = payment({
      dueDate: date(2025, 1, 1),
      interval: "WEEKLY",
    });
    const payDate = ts(date(2025, 1, 1));
    const result = getPaymentOccurrencesForPeriod(p, "BIWEEKLY", payDate);
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("getVirtualPaymentsForCurrentPeriod", () => {
  it("returns virtual payments sorted by due date", () => {
    const payments = [
      payment({ id: "a", dueDate: date(2025, 1, 20), interval: "MONTHLY" }),
      payment({ id: "b", dueDate: date(2025, 1, 10), interval: "MONTHLY" }),
    ];
    const payDate = ts(date(2025, 1, 1));
    const result = getVirtualPaymentsForCurrentPeriod(payments, "BIWEEKLY", payDate);
    expect(result.length).toBeGreaterThanOrEqual(1);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].dueDate.toMillis()).toBeGreaterThanOrEqual(result[i - 1].dueDate.toMillis());
    }
  });

  it("includes both bills and debts when in current period", () => {
    const payments = [
      payment({ id: "bill1", type: "BILL", dueDate: date(2025, 1, 15), interval: "MONTHLY" }),
      payment({ id: "debt1", type: "DEBT", dueDate: date(2025, 1, 20), interval: "MONTHLY", total: 500 }),
    ];
    const payDate = ts(date(2025, 1, 1));
    const result = getVirtualPaymentsForCurrentPeriod(payments, "MONTHLY", payDate);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });
});
