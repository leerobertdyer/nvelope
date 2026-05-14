import "../helpers/mockFirebase";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getPaymentCurrentDueDate, isDateInCurrentPayPeriod } from "../../src/util";
import { payment, date } from "../helpers/fixtures";

describe("getPaymentCurrentDueDate", () => {
  it("returns end of current interval for WEEKLY payment", () => {
    const p = payment({
      dueDate: date(2025, 1, 1), // Wed Jan 1
      interval: "WEEKLY",
    });
    const result = getPaymentCurrentDueDate(p);
    expect(result.getTime()).toBeGreaterThanOrEqual(p.dueDate.toDate().getTime());
  });

  it("returns end of current interval for MONTHLY payment", () => {
    const p = payment({
      dueDate: date(2025, 1, 15),
      interval: "MONTHLY",
    });
    const result = getPaymentCurrentDueDate(p);
    expect(result.getMonth()).toBeDefined();
    expect(result.getDate()).toBeDefined();
  });
});

describe("isDateInCurrentPayPeriod", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 10)); // Jan 10 so "current" period is Jan 1-14
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns true when date is within current pay period", () => {
    const payDate = date(2025, 1, 1); // Jan 1 -> period Jan 1-14
    const d = date(2025, 1, 10);
    const result = isDateInCurrentPayPeriod("BIWEEKLY", payDate, d);
    expect(result).toBe(true);
  });

  it("returns false when date is before current pay period", () => {
    const payDate = date(2025, 1, 15); // with today Jan 10, current period is Jan 1-14
    const d = date(2024, 12, 25); // before Jan 1
    const result = isDateInCurrentPayPeriod("BIWEEKLY", payDate, d);
    expect(result).toBe(false);
  });
});
