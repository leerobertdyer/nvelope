import "../helpers/mockFirebase";
import { describe, it, expect } from "vitest";
import { deriveIsPaid } from "../../src/util";
import {
  computeUpdatedPayment,
  getSnowballAmount,
  getSnowballName,
  getSnowballPayment,
  togglePaidDates,
} from "../../src/util/paymentUtils";
import { payment, date } from "../helpers/fixtures";

describe("deriveIsPaid + computeUpdatedPayment (paidDates model)", () => {
  it("marks a monthly debt paid via paidDates only, decrementing total once", () => {
    const original = payment({
      id: "debt-1",
      type: "DEBT",
      amount: 200,
      total: 1000,
      interval: "MONTHLY",
      dueDate: date(2025, 1, 1),
    });
    const virtual = { ...original, dueDate: original.dueDate };

    const updated = computeUpdatedPayment(original, virtual);

    expect(deriveIsPaid(updated)).toBe(true);
    expect(updated.total).toBe(800);
    expect(updated.paid).toBeUndefined();
  });

  it("re-reading an already-mobile-paid monthly debt on web does not double-decrement total", () => {
    // Simulates: mobile already toggled paidDates for this occurrence.
    const alreadyPaidOnMobile = togglePaidDates(
      payment({
        id: "debt-1",
        type: "DEBT",
        amount: 200,
        total: 1000,
        interval: "MONTHLY",
        dueDate: date(2025, 1, 1),
      }),
      date(2025, 1, 1)
    );
    const withTotalApplied = {
      ...alreadyPaidOnMobile,
      total: 800,
      paidAmounts: { [date(2025, 1, 1).getTime().toString()]: 200 },
    };

    expect(deriveIsPaid(withTotalApplied)).toBe(true);

    // Web unmarks it (toggle off) using the same occurrence key mobile used.
    const virtual = { ...withTotalApplied, dueDate: withTotalApplied.dueDate };
    const unmarked = computeUpdatedPayment(withTotalApplied, virtual);

    expect(deriveIsPaid(unmarked)).toBe(false);
    expect(unmarked.total).toBe(1000);
  });

  it("decrements total for FUND payments the same as DEBT", () => {
    const original = payment({
      id: "fund-1",
      type: "FUND",
      amount: 50,
      total: 300,
      interval: "MONTHLY",
      dueDate: date(2025, 1, 1),
    });
    const virtual = { ...original };

    const updated = computeUpdatedPayment(original, virtual);

    expect(updated.total).toBe(250);
    expect(deriveIsPaid(updated)).toBe(true);
  });

  it("does not touch total for non-debt, non-fund payment types", () => {
    const original = payment({
      id: "bill-1",
      type: "MISC",
      amount: 50,
      total: 300,
      interval: "MONTHLY",
      dueDate: date(2025, 1, 1),
    });
    const virtual = { ...original };

    const updated = computeUpdatedPayment(original, virtual);

    expect(updated.total).toBe(300);
    expect(deriveIsPaid(updated)).toBe(true);
  });
});

describe("snowball as a payment row", () => {
  it("reads the snowball amount by id, regardless of the row's display name", () => {
    const payments = [
      payment({ id: "debt-a", name: "Card A", type: "DEBT", amount: 100 }),
      payment({ id: "SNOWBALL", name: "❄️Snowball❄️", type: "DEBT", amount: 75 }),
    ];

    expect(getSnowballAmount(payments)).toBe(75);
  });

  it("falls back to matching by name for legacy rows without the SNOWBALL id", () => {
    const payments = [
      payment({ id: "debt-a", name: "Card A", type: "DEBT", amount: 100 }),
      payment({ id: "legacy-row-id", name: "❄️Snowball❄️", type: "DEBT", amount: 42 }),
    ];

    expect(getSnowballAmount(payments)).toBe(42);
  });

  it("returns 0 when there is no snowball row yet", () => {
    const payments = [
      payment({ id: "debt-a", name: "Card A", type: "DEBT", amount: 100 }),
    ];

    expect(getSnowballAmount(payments)).toBe(0);
  });

  it("resolves the target debt's name and payment for the snowball label", () => {
    const target = payment({ id: "debt-a", name: "Card A", type: "DEBT", amount: 100 });
    const payments = [target, payment({ id: "SNOWBALL", name: "❄️Snowball❄️", type: "DEBT", amount: 75 })];

    expect(getSnowballName(payments, "debt-a")).toBe("Card A");
    expect(getSnowballPayment(payments, "debt-a")).toBe(target);
  });

  it("falls back to a placeholder label when no snowball target is set", () => {
    const payments = [payment({ id: "debt-a", name: "Card A", type: "DEBT", amount: 100 })];

    expect(getSnowballName(payments, "")).toBe("Set Snowball");
  });
});
