import "../helpers/mockFirebase";
import { describe, it, expect } from "vitest";
import {
  getRemainingDebtsForSnowball,
  pickNextSnowballTarget,
  rollSnowballOnPayoff,
  setSnowballAmount,
} from "../../src/util";
import { payment, date, ts } from "../helpers/fixtures";

describe("rollSnowballOnPayoff", () => {
  it("creates the snowball row with the paid-off debt's amount when none exists yet", () => {
    const paidOff = payment({ id: "debt-a", type: "DEBT", amount: 150, total: 0 });
    const updated = rollSnowballOnPayoff(
      [paidOff],
      paidOff,
      ts(date(2025, 1, 1))
    );

    const snowball = updated.find((p) => p.id === "SNOWBALL");
    expect(snowball?.amount).toBe(150);
    expect(snowball?.type).toBe("DEBT");
  });

  it("adds the paid-off amount onto an existing snowball row", () => {
    const paidOff = payment({ id: "debt-a", type: "DEBT", amount: 150, total: 0 });
    const existingSnowball = payment({
      id: "SNOWBALL",
      name: "❄️Snowball❄️",
      type: "DEBT",
      amount: 50,
    });
    const updated = rollSnowballOnPayoff(
      [paidOff, existingSnowball],
      paidOff,
      ts(date(2025, 1, 1))
    );

    const snowball = updated.find((p) => p.id === "SNOWBALL");
    expect(snowball?.amount).toBe(200);
    expect(updated).toHaveLength(2);
  });
});

describe("setSnowballAmount", () => {
  it("sets (not adds to) the snowball row's amount", () => {
    const existingSnowball = payment({
      id: "SNOWBALL",
      name: "❄️Snowball❄️",
      type: "DEBT",
      amount: 50,
    });
    const updated = setSnowballAmount(
      [existingSnowball],
      300,
      ts(date(2025, 1, 1))
    );

    expect(updated.find((p) => p.id === "SNOWBALL")?.amount).toBe(300);
  });

  it("creates the row when none exists yet", () => {
    const updated = setSnowballAmount([], 300, ts(date(2025, 1, 1)));
    expect(updated.find((p) => p.id === "SNOWBALL")?.amount).toBe(300);
  });
});

describe("pickNextSnowballTarget / getRemainingDebtsForSnowball", () => {
  it("returns null and an empty list when no remaining debts", () => {
    const paidOff = payment({ id: "debt-last", type: "DEBT", amount: 100, total: 0 });

    expect(pickNextSnowballTarget([paidOff], "debt-last")).toBeNull();
    expect(getRemainingDebtsForSnowball([paidOff], "debt-last")).toEqual([]);
  });

  it("picks the debt with the lowest remaining total, excluding the snowball row and the paid-off debt", () => {
    const paidOff = payment({ id: "debt-1", type: "DEBT", amount: 100, total: 0 });
    const low = payment({ id: "debt-low", type: "DEBT", amount: 50, total: 200 });
    const high = payment({ id: "debt-high", type: "DEBT", amount: 75, total: 500 });
    const snowball = payment({
      id: "SNOWBALL",
      name: "❄️Snowball❄️",
      type: "DEBT",
      amount: 100,
      total: 999,
    });
    const payments = [paidOff, high, low, snowball];

    expect(pickNextSnowballTarget(payments, "debt-1")?.id).toBe("debt-low");
    expect(
      getRemainingDebtsForSnowball(payments, "debt-1").map((p) => p.id)
    ).toEqual(["debt-low", "debt-high"]);
  });
});
