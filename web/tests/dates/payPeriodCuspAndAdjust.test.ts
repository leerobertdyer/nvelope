import "../helpers/mockFirebase";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isTodayCuspDate, adjustPaymentToCurrentPeriod } from "../../src/util";
import { payment, date, ts } from "../helpers/fixtures";

describe("isTodayCuspDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns true when period end is in the future and in a different month than today", () => {
    // Today = Jan 31; biweekly period starting Jan 15 ends Jan 28 (past). Need period that ends in Feb.
    // Set today to Jan 30. Biweekly pay date Jan 15 -> period Jan 15-28. So end Jan 28, same month. 
    // Set today to Jan 15. Biweekly pay date Jan 1 -> period Jan 1-14. End Jan 14, same month.
    // For cusp: we need end > today and end.getMonth() !== today.getMonth().
    // So e.g. today Jan 31, pay date Jan 15 BIWEEKLY -> current period start = Jan 15, end = Jan 28. End is not in future.
    // Today Jan 20, pay date Jan 15 BIWEEKLY -> period Jan 15-28. End Jan 28 is in future and same month.
    // Today Jan 29, pay date Jan 15 BIWEEKLY -> period Jan 15-28. End Jan 28 is not in future (Jan 29 > Jan 28).
    // So we need a period that spans into next month. Monthly: pay date Jan 15 -> period Jan 15 - Feb 14. End = Feb 14. Set today = Jan 20. Then end (Feb 14) is in future and end.getMonth() !== today.getMonth() -> true.
    vi.setSystemTime(new Date(2025, 0, 20)); // Jan 20
    const payDate = ts(date(2025, 1, 15)); // Jan 15
    const result = isTodayCuspDate("MONTHLY", payDate);
    expect(result).toBe(true);
  });

  it("returns false when period end is in the same month as today", () => {
    vi.setSystemTime(new Date(2025, 0, 10)); // Jan 10
    const payDate = ts(date(2025, 1, 1)); // Jan 1, BIWEEKLY period Jan 1-14
    const result = isTodayCuspDate("BIWEEKLY", payDate);
    expect(result).toBe(false);
  });
});

describe("adjustPaymentToCurrentPeriod", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns payment with due date adjusted to current period for MONTHLY", () => {
    vi.setSystemTime(new Date(2025, 0, 15)); // Jan 15
    const p = payment({
      dueDate: date(2024, 12, 20),
      interval: "MONTHLY",
    });
    const payDate = ts(date(2025, 1, 1));
    const result = adjustPaymentToCurrentPeriod(p, "BIWEEKLY", payDate);
    expect(result.dueDate.toDate().getMonth()).toBe(0);
    expect(result.dueDate.toDate().getFullYear()).toBe(2025);
    expect(result.dueDate.toDate().getDate()).toBe(20);
  });

  it("clamps day to last day of month when needed", () => {
    vi.setSystemTime(new Date(2025, 0, 15)); // Jan 15
    const p = payment({
      dueDate: date(2024, 12, 31),
      interval: "MONTHLY",
    });
    const payDate = ts(date(2025, 1, 1));
    const result = adjustPaymentToCurrentPeriod(p, "MONTHLY", payDate);
    expect(result.dueDate.toDate().getMonth()).toBe(0);
    expect(result.dueDate.toDate().getDate()).toBe(31);
  });
});
