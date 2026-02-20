import "../helpers/mockFirebase";
import { describe, it, expect } from "vitest";
import { applyPayoffRoll } from "../../src/util";
import { payment, date } from "../helpers/fixtures";

describe("applyPayoffRoll", () => {
  it("bakes snowball + paid-off amount into next target and returns updated payments", () => {
    const paidOff = payment({
      id: "debt-a",
      type: "DEBT",
      amount: 150,
      total: 0,
      dueDate: date(2025, 1, 1),
      interval: "MONTHLY",
    });
    const nextDebt = payment({
      id: "debt-b",
      type: "DEBT",
      amount: 200,
      total: 1000,
      dueDate: date(2025, 1, 1),
      interval: "MONTHLY",
    });
    const payments = [paidOff, nextDebt];
    const snowball = 229;

    const { updatedPayments, nextTargetId } = applyPayoffRoll(
      payments,
      paidOff,
      snowball
    );

    expect(nextTargetId).toBe("debt-b");
    const updatedB = updatedPayments.find((p) => p.id === "debt-b");
    expect(updatedB?.amount).toBe(200 + 229 + 150); // 200 + snowball + paidOff.amount = 579
  });

  it("returns same payments and null nextTargetId when no remaining debts", () => {
    const paidOff = payment({
      id: "debt-last",
      type: "DEBT",
      amount: 100,
      total: 0,
      dueDate: date(2025, 1, 1),
      interval: "MONTHLY",
    });
    const payments = [paidOff];
    const snowball = 50;

    const { updatedPayments, nextTargetId } = applyPayoffRoll(
      payments,
      paidOff,
      snowball
    );

    expect(nextTargetId).toBeNull();
    expect(updatedPayments).toEqual(payments);
  });

  it("picks next target as debt with lowest remaining total", () => {
    const paidOff = payment({
      id: "debt-1",
      type: "DEBT",
      amount: 100,
      total: 0,
      dueDate: date(2025, 1, 1),
      interval: "MONTHLY",
    });
    const low = payment({
      id: "debt-low",
      type: "DEBT",
      amount: 50,
      total: 200,
      dueDate: date(2025, 1, 1),
      interval: "MONTHLY",
    });
    const high = payment({
      id: "debt-high",
      type: "DEBT",
      amount: 75,
      total: 500,
      dueDate: date(2025, 1, 1),
      interval: "MONTHLY",
    });
    const payments = [paidOff, high, low];
    const snowball = 100;

    const { updatedPayments, nextTargetId } = applyPayoffRoll(
      payments,
      paidOff,
      snowball
    );

    expect(nextTargetId).toBe("debt-low");
    const updatedLow = updatedPayments.find((p) => p.id === "debt-low");
    expect(updatedLow?.amount).toBe(50 + 100 + 100); // 250
    const unchangedHigh = updatedPayments.find((p) => p.id === "debt-high");
    expect(unchangedHigh?.amount).toBe(75);
  });
});
