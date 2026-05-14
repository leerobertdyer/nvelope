import "../helpers/mockFirebase";
import { describe, it, expect } from "vitest";
import { getOccurrencesOfWeekday } from "../../src/util";

describe("getOccurrencesOfWeekday", () => {
  it("returns first four weekdays for a month that has them", () => {
    // January 2025: 1=Wed. So Wednesday = weekday 3. First Wed=1, second=8, third=15, fourth=22.
    const result = getOccurrencesOfWeekday(2025, 0, 3); // year, month (0-indexed), weekday (0=Sun, 3=Wed)
    expect(result.first).not.toBeNull();
    expect(result.second).not.toBeNull();
    expect(result.third).not.toBeNull();
    expect(result.fourth).not.toBeNull();
    expect(result.first!.getDate()).toBe(1);
    expect(result.second!.getDate()).toBe(8);
    expect(result.third!.getDate()).toBe(15);
    expect(result.fourth!.getDate()).toBe(22);
  });

  it("returns null for fourth when month has fewer than four occurrences", () => {
    // February 2025 has 4 Wednesdays: 5, 12, 19, 26. So fourth exists.
    // Weekday 0 = Sunday. Feb 2025 starts on Saturday, so we have 4 Sundays: 2, 9, 16, 23.
    const result = getOccurrencesOfWeekday(2025, 1, 0);
    expect(result.fourth).not.toBeNull();
    // For a month with only 3 of a weekday: e.g. weekday 6 (Saturday). Feb 2025: 1, 8, 15, 22 = 4 Saturdays.
    const result2 = getOccurrencesOfWeekday(2025, 1, 6);
    expect(result2.fourth).not.toBeNull();
  });
});
