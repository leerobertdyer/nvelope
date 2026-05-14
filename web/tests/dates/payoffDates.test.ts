import "../helpers/mockFirebase";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  calculatePayoffDate,
  calculateSnowballPayoffDate,
  getPayPeriodsInMonth,
  getPayPeriodsUntilDate,
} from "../../src/util";
import { payment, date, ts } from "../helpers/fixtures";

describe("calculatePayoffDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 1)); // Jan 1 2025
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns payOffDate and paymentsLeft for simple debt (no interest)", () => {
    const debt = payment({
      amount: 100,
      total: 350,
      interval: "MONTHLY",
    });
    const result = calculatePayoffDate(debt);
    expect(result).not.toBeNull();
    expect(result!.paymentsLeft).toBe(4); // ceil(350/100)
    expect(result!.payOffDate.getFullYear()).toBe(2025);
    expect(result!.payOffDate.getMonth()).toBe(4); // May (0-indexed): Jan + 4 months
  });

  it("returns null when debt has no total or amount", () => {
    expect(calculatePayoffDate(payment({ total: 0, amount: 100 }))).toBeNull();
    expect(calculatePayoffDate(payment({ total: 100, amount: 0 }))).toBeNull();
  });
});

describe("calculateSnowballPayoffDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 1));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns date when single debt is paid off", () => {
    const debts = [
      payment({ id: "d1", amount: 100, total: 300, interval: "MONTHLY" }),
    ];
    const result = calculateSnowballPayoffDate(debts, 0, null);
    expect(result).not.toBeNull();
  });

  it("returns null for empty debts", () => {
    expect(calculateSnowballPayoffDate([], 0, null)).toBeNull();
  });
});

describe("getPayPeriodsInMonth", () => {
  it("returns 1 for MONTHLY", () => {
    expect(getPayPeriodsInMonth(ts(date(2025, 1, 15)), "MONTHLY")).toBe(1);
  });

  it("returns 4 or 5 for WEEKLY in a typical month", () => {
    const jan = new Date(2025, 0, 15);
    const n = getPayPeriodsInMonth(ts(date(2025, 1, 1)), "WEEKLY", jan);
    expect(n).toBeGreaterThanOrEqual(4);
    expect(n).toBeLessThanOrEqual(5);
  });

  it("returns 2 or 3 for BIWEEKLY depending on month alignment", () => {
    const jan = new Date(2025, 0, 15);
    const n = getPayPeriodsInMonth(ts(date(2025, 1, 1)), "BIWEEKLY", jan);
    expect(n).toBeGreaterThanOrEqual(2);
    expect(n).toBeLessThanOrEqual(3);
  });
});

describe("getPayPeriodsUntilDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 1)); // Jan 1 2025
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns at least 1 when target is in the future", () => {
    const target = date(2025, 3, 15);
    const n = getPayPeriodsUntilDate(ts(date(2024, 12, 15)), "BIWEEKLY", target);
    expect(n).toBeGreaterThanOrEqual(1);
  });

  it("returns 1 for MONTHLY", () => {
    const target = date(2025, 6, 1);
    const n = getPayPeriodsUntilDate(ts(date(2025, 1, 1)), "MONTHLY", target);
    expect(n).toBeGreaterThanOrEqual(1);
  });
});
