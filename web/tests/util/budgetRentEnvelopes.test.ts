import "../helpers/mockFirebase";
import { describe, it, expect } from "vitest";
import {
  recalculateBudget,
  recalculateRentPayment,
  resetEnvelopesSpentToZero,
} from "../../src/util";
import { envelope } from "../helpers/fixtures";

describe("recalculateBudget", () => {
  it("adds diffAmount to currentAvailableBudget", () => {
    expect(recalculateBudget({ currentAvailableBudget: 100, diffAmount: 50 })).toBe(150);
    expect(recalculateBudget({ currentAvailableBudget: 200, diffAmount: -30 })).toBe(170);
  });
});

describe("recalculateRentPayment", () => {
  it("returns rent unchanged for MONTHLY", () => {
    expect(recalculateRentPayment(1200, "MONTHLY")).toBe(1200);
  });

  it("returns rent/2 for BIWEEKLY", () => {
    expect(recalculateRentPayment(1200, "BIWEEKLY")).toBe(600);
  });

  it("returns rent/4 for WEEKLY", () => {
    expect(recalculateRentPayment(1200, "WEEKLY")).toBe(300);
  });

  it("returns rent for other/undefined interval", () => {
    expect(recalculateRentPayment(100, undefined)).toBe(100);
  });
});

describe("resetEnvelopesSpentToZero", () => {
  it("returns envelopes with spent set to 0", () => {
    const envelopes = [
      envelope({ id: "e1", spent: 50, total: 100 }),
      envelope({ id: "e2", spent: 25, total: 50 }),
    ];
    const result = resetEnvelopesSpentToZero(envelopes);
    expect(result).toHaveLength(2);
    expect(result[0].spent).toBe(0);
    expect(result[1].spent).toBe(0);
    expect(result[0].total).toBe(100);
    expect(result[1].total).toBe(50);
  });
});
