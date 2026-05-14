import type { Payment, Envelope } from "../../src/types";
import { Timestamp } from "firebase/firestore";

/** Fixed date for deterministic tests (Jan 15, 2025) */
export const FIXED_DATE = new Date(2025, 0, 15);

/** Build a Date at start of day for a given y, m, d */
export function date(y: number, m: number, d: number): Date {
  return new Date(y, m - 1, d);
}

/** Build a Firestore Timestamp from a Date */
export function ts(d: Date): Timestamp {
  return Timestamp.fromDate(d);
}

export interface PaymentOverrides {
  id?: string;
  name?: string;
  amount?: number;
  dueDate?: Timestamp | Date;
  interval?: Payment["interval"];
  paid?: boolean;
  type?: Payment["type"];
  total?: number;
  interestRate?: number;
  recurring?: boolean;
  paidDates?: Timestamp[];
}

/**
 * Build a Payment for tests. Uses fixed defaults; pass overrides as needed.
 * dueDate can be Date or Timestamp; converted to Timestamp internally.
 */
export function payment(overrides: PaymentOverrides = {}): Payment {
  const dueDate =
    overrides.dueDate instanceof Date
      ? Timestamp.fromDate(overrides.dueDate)
      : (overrides.dueDate ?? Timestamp.fromDate(FIXED_DATE));
  return {
    id: overrides.id ?? "pay-1",
    name: overrides.name ?? "Test payment",
    amount: overrides.amount ?? 100,
    dueDate,
    interval: overrides.interval ?? "MONTHLY",
    paid: overrides.paid ?? false,
    type: overrides.type,
    total: overrides.total,
    interestRate: overrides.interestRate,
    recurring: overrides.recurring,
    paidDates: overrides.paidDates,
  } as Payment;
}

export function envelope(overrides: Partial<Envelope> = {}): Envelope {
  return {
    id: overrides.id ?? "env-1",
    name: overrides.name ?? "Test envelope",
    total: overrides.total ?? 0,
    spent: overrides.spent ?? 0,
    ...overrides,
  };
}
