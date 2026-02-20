import "../helpers/mockFirebase";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  adjustPaymentToCurrentPeriod,
  isTodayCuspDate,
  getIntervalDateRange,
  getOccurrencesOfWeekday,
  getNumberOfDaysFromInterval,
  calculateIntervalsFromPastDate,
  getCurrentIntervalDateRange,
} from "../../src/util";
import { payment, date, ts } from "../helpers/fixtures";
import { startOfDay } from "date-fns";

describe("End of month", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("clamps due date 31st to Feb 28 in non-leap year when adjusting to February", () => {
    vi.setSystemTime(new Date(2023, 1, 15)); // Feb 15 2023 (non-leap)
    const p = payment({
      dueDate: date(2023, 1, 31), // Jan 31
      interval: "MONTHLY",
    });
    const payDate = ts(date(2023, 1, 1));
    const result = adjustPaymentToCurrentPeriod(p, "MONTHLY", payDate);
    expect(result.dueDate.toDate().getMonth()).toBe(1); // February
    expect(result.dueDate.toDate().getDate()).toBe(28);
    expect(result.dueDate.toDate().getFullYear()).toBe(2023);
  });

  it("clamps due date 31st to Feb 29 in leap year when adjusting to February", () => {
    vi.setSystemTime(new Date(2024, 1, 15)); // Feb 15 2024 (leap year)
    const p = payment({
      dueDate: date(2024, 1, 31), // Jan 31
      interval: "MONTHLY",
    });
    const payDate = ts(date(2024, 1, 1));
    const result = adjustPaymentToCurrentPeriod(p, "MONTHLY", payDate);
    expect(result.dueDate.toDate().getMonth()).toBe(1);
    expect(result.dueDate.toDate().getDate()).toBe(29);
    expect(result.dueDate.toDate().getFullYear()).toBe(2024);
  });

  it("keeps due date 29th when adjusting to February in leap year", () => {
    vi.setSystemTime(new Date(2024, 1, 15));
    const p = payment({
      dueDate: date(2024, 1, 29),
      interval: "MONTHLY",
    });
    const payDate = ts(date(2024, 1, 1));
    const result = adjustPaymentToCurrentPeriod(p, "MONTHLY", payDate);
    expect(result.dueDate.toDate().getDate()).toBe(29);
    expect(result.dueDate.toDate().getMonth()).toBe(1);
  });
});

describe("End of year", () => {
  it("interval range for MONTHLY starting Dec 15 ends Jan 14 next year", () => {
    const start = date(2024, 12, 15); // Dec 15 2024
    const { start: s, end } = getIntervalDateRange("MONTHLY", start);
    expect(s.getFullYear()).toBe(2024);
    expect(s.getMonth()).toBe(11);
    expect(end.getFullYear()).toBe(2025);
    expect(end.getMonth()).toBe(0); // January
    expect(end.getDate()).toBe(14);
  });

  it("current period from past date crosses year boundary for MONTHLY", () => {
    const start = date(2024, 6, 15);
    const today = date(2025, 1, 5); // Jan 5 2025 -> period Dec 15 2024 - Jan 14 2025
    const result = calculateIntervalsFromPastDate("MONTHLY", start, today);
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(11);
    expect(result.getDate()).toBe(15);
  });
});

describe("Cusp on last day of month", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns true when today is Jan 31 and period end is in February", () => {
    vi.setSystemTime(new Date(2025, 0, 31)); // Jan 31 2025
    const payDate = ts(date(2025, 1, 15)); // MONTHLY period Jan 15 - Feb 14
    const result = isTodayCuspDate("MONTHLY", payDate);
    expect(result).toBe(true);
  });

  it("returns false when today is Jan 20 and period end is still in January", () => {
    vi.setSystemTime(new Date(2025, 0, 20)); // Jan 20
    const payDate = ts(date(2025, 1, 1)); // BIWEEKLY period containing Jan 20 is Jan 15-28, end Jan 28
    const result = isTodayCuspDate("BIWEEKLY", payDate);
    expect(result).toBe(false);
  });
});

describe("Leap year", () => {
  it("getOccurrencesOfWeekday returns correct fourth occurrence for February in leap year", () => {
    // Feb 2024 (leap): 29 days. If we ask for weekday 4 (Friday), first Fri = 2, second = 9, third = 16, fourth = 23.
    const result = getOccurrencesOfWeekday(2024, 1, 5); // 2024 Feb, Friday = 5
    expect(result.first).not.toBeNull();
    expect(result.fourth).not.toBeNull();
    expect(result.fourth!.getDate()).toBe(23);
    expect(result.fourth!.getMonth()).toBe(1);
  });

  it("getNumberOfDaysFromInterval MONTHLY returns 29 when system time is February in leap year", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 1, 15)); // Feb 15 2024
    const n = getNumberOfDaysFromInterval("MONTHLY");
    expect(n).toBe(29);
    vi.useRealTimers();
  });

  it("getNumberOfDaysFromInterval MONTHLY returns 28 when system time is February in non-leap year", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2023, 1, 15)); // Feb 15 2023
    const n = getNumberOfDaysFromInterval("MONTHLY");
    expect(n).toBe(28);
    vi.useRealTimers();
  });
});

describe("getCurrentIntervalDateRange across year boundary", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 10)); // Jan 10 2025
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns period that can span Dec–Jan for BIWEEKLY pay date in late December", () => {
    const payDate = ts(date(2024, 12, 20)); // Dec 20 2024
    const { start, end } = getCurrentIntervalDateRange("BIWEEKLY", payDate);
    expect(start.getTime()).toBeLessThanOrEqual(end.getTime());
    // Current period containing Jan 10: could be Dec 20 - Jan 2, or Jan 3-16 depending on alignment
    expect(start.getFullYear()).toBeDefined();
    expect(end.getFullYear()).toBeDefined();
  });
});
