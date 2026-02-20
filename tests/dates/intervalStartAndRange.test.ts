import "../helpers/mockFirebase";
import { describe, it, expect } from "vitest";
import {
  calculateCurrentIntervalStart,
  calculateIntervalsFromPastDate,
  calculateIntervalsFromFutureDate,
  getIntervalDateRange,
  getCurrentIntervalDateRange,
  getNumberOfDaysFromInterval,
} from "../../src/util";
import { date, ts } from "../helpers/fixtures";
import { startOfDay } from "date-fns";

describe("calculateIntervalsFromPastDate", () => {
  it("returns current period start for WEEKLY when start is before today", () => {
    const start = date(2025, 1, 1); // Jan 1
    const today = date(2025, 1, 15); // Jan 15 is a period start (Wed); current period starts Jan 15
    const result = calculateIntervalsFromPastDate("WEEKLY", start, today);
    expect(result).toEqual(startOfDay(date(2025, 1, 15)));
  });

  it("returns current period start for BIWEEKLY when start is before today", () => {
    const start = date(2025, 1, 1);
    const today = date(2025, 1, 15); // period containing Jan 15 is Jan 15-28 (start = 15)
    const result = calculateIntervalsFromPastDate("BIWEEKLY", start, today);
    expect(result).toEqual(startOfDay(date(2025, 1, 15)));
  });

  it("returns current period start for MONTHLY when start is before today", () => {
    const start = date(2024, 6, 15);
    const today = date(2025, 1, 10); // period containing Jan 10 is Dec 15 - Jan 14
    const result = calculateIntervalsFromPastDate("MONTHLY", start, today);
    expect(result).toEqual(startOfDay(date(2024, 12, 15)));
  });
});

describe("calculateIntervalsFromFutureDate", () => {
  it("walks backward for WEEKLY when start is after today", () => {
    const start = date(2025, 2, 1);
    const today = date(2025, 1, 15);
    const result = calculateIntervalsFromFutureDate("WEEKLY", start, today);
    expect(result).toEqual(startOfDay(date(2025, 1, 11)));
  });

  it("walks backward for BIWEEKLY when start is after today", () => {
    const start = date(2025, 2, 15);
    const today = date(2025, 1, 10);
    const result = calculateIntervalsFromFutureDate("BIWEEKLY", start, today);
    expect(result.getTime()).toBeLessThanOrEqual(today.getTime());
  });
});

describe("calculateCurrentIntervalStart", () => {
  it("uses past-date logic when pay date is before today", () => {
    const payDate = date(2025, 1, 1);
    const result = calculateCurrentIntervalStart(payDate, "WEEKLY");
    expect(result.getTime()).toBeLessThanOrEqual(startOfDay(new Date()).getTime());
  });

  it("uses future-date logic when pay date is after today", () => {
    const payDate = date(2030, 1, 1);
    const result = calculateCurrentIntervalStart(payDate, "WEEKLY");
    expect(result.getTime()).toBeLessThanOrEqual(startOfDay(new Date()).getTime());
  });
});

describe("getIntervalDateRange", () => {
  it("returns 7-day range for WEEKLY (end is start + 7 - 1 day)", () => {
    const start = date(2025, 1, 8);
    const { start: s, end } = getIntervalDateRange("WEEKLY", start);
    expect(s).toEqual(start);
    expect(end.getDate()).toBe(14);
    expect(end.getMonth()).toBe(0);
  });

  it("returns 14-day range for BIWEEKLY", () => {
    const start = date(2025, 1, 15);
    const { end } = getIntervalDateRange("BIWEEKLY", start);
    expect(end.getDate()).toBe(28);
  });

  it("returns month range for MONTHLY", () => {
    const start = date(2025, 1, 15);
    const { end } = getIntervalDateRange("MONTHLY", start);
    expect(end.getMonth()).toBe(1); // Feb
    expect(end.getDate()).toBe(14); // 1 day before next period start
  });
});

describe("getCurrentIntervalDateRange", () => {
  it("returns start and end for current period from pay date", () => {
    const payDate = ts(date(2025, 1, 1));
    const { start, end } = getCurrentIntervalDateRange("BIWEEKLY", payDate);
    expect(start.getTime()).toBeLessThanOrEqual(end.getTime());
    expect(end.getTime() - start.getTime()).toBeGreaterThanOrEqual(13 * 24 * 60 * 60 * 1000);
  });
});

describe("getNumberOfDaysFromInterval", () => {
  it("returns 7 for WEEKLY", () => {
    expect(getNumberOfDaysFromInterval("WEEKLY")).toBe(7);
  });
  it("returns 14 for BIWEEKLY", () => {
    expect(getNumberOfDaysFromInterval("BIWEEKLY")).toBe(14);
  });
  it("returns 365 for YEARLY", () => {
    expect(getNumberOfDaysFromInterval("YEARLY")).toBe(365);
  });
  it("returns 28-31 for MONTHLY (days in current month)", () => {
    const n = getNumberOfDaysFromInterval("MONTHLY");
    expect(n).toBeGreaterThanOrEqual(28);
    expect(n).toBeLessThanOrEqual(31);
  });
});
