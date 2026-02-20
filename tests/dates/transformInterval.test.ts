import "../helpers/mockFirebase";
import { describe, it, expect } from "vitest";
import { transformIntervalMidSentence } from "../../src/util";

describe("transformIntervalMidSentence", () => {
  it("returns 'week' for WEEKLY", () => {
    expect(transformIntervalMidSentence("WEEKLY")).toBe("week");
  });
  it("returns 'other week' for BIWEEKLY", () => {
    expect(transformIntervalMidSentence("BIWEEKLY")).toBe("other week");
  });
  it("returns 'month' for MONTHLY", () => {
    expect(transformIntervalMidSentence("MONTHLY")).toBe("month");
  });
  it("returns 'year' for YEARLY", () => {
    expect(transformIntervalMidSentence("YEARLY")).toBe("year");
  });
});
