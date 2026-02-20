import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUpdateDoc = vi.hoisted(() => vi.fn());

vi.mock("../../src/firebase/firebase", () => ({
  app: {},
  analytics: {},
  auth: {},
  googleProvider: {},
  db: {},
}));

vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  return {
    ...actual,
    updateDoc: mockUpdateDoc,
    doc: vi.fn(() => ({})),
  };
});

vi.mock("../../src/firebase/budgets", () => ({
  budgetDataRef: vi.fn(() => ({})),
}));

import { editPayments, editEnvelopes, editPayDate } from "../../src/firebase/editData";
import { payment, date, ts } from "../helpers/fixtures";
import type { Envelope } from "../../src/types";

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdateDoc.mockClear();
});

describe("editPayments", () => {
  it("sorts payments by dueDate.seconds then writes cleaned payload to doc", async () => {
    const later = ts(date(2025, 2, 1));
    const earlier = ts(date(2025, 1, 15));
    const payments = [
      payment({ id: "b", dueDate: later, amount: 200 }),
      payment({ id: "a", dueDate: earlier, amount: 100 }),
    ];
    await editPayments(payments, "budget-1");

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    const [ref, data] = mockUpdateDoc.mock.calls[0];
    expect(ref).toBeDefined();
    expect(data.payments).toBeDefined();
    expect(data.payments).toHaveLength(2);
    expect(data.payments[0].amount).toBe(100);
    expect(data.payments[1].amount).toBe(200);
    data.payments.forEach((row: Record<string, unknown>) => {
      expect(Object.values(row).every((v) => v !== undefined)).toBe(true);
    });
  });
});

describe("editEnvelopes", () => {
  it("fixes envelope totals to 2 decimals and writes to doc", async () => {
    const envelopes: Envelope[] = [
      { id: "e1", name: "Groceries", total: 10.567, spent: 0 },
      { id: "e2", name: "Fun", total: 20.999, spent: 5 },
    ];
    await editEnvelopes(envelopes, "budget-1");

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    const [, data] = mockUpdateDoc.mock.calls[0];
    expect(data.envelopes).toHaveLength(2);
    expect(data.envelopes[0].total).toBe(10.57);
    expect(data.envelopes[1].total).toBe(21);
  });
});

describe("editPayDate", () => {
  it("converts Date to Timestamp and writes payDate to doc", async () => {
    const d = new Date(2025, 0, 15);
    await editPayDate(d, "budget-1");

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    const [, data] = mockUpdateDoc.mock.calls[0];
    expect(data.payDate).toBeDefined();
    expect(data.payDate.seconds).toBeDefined();
    expect(data.payDate.toDate).toBeDefined();
  });
});
