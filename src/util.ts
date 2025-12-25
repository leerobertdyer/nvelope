import type { User } from "firebase/auth";
import type {
  Payment,
  Envelope,
  Interval,
  IntervalDates,
  Backup,
} from "./types";
import { editTotalSpendingBudget, editEnvelopes } from "./firebase/editData";
import { BIWEEKLY, MONTHLY, WEEKLY, YEARLY } from "./constants";
import {
  addMonths,
  addWeeks,
  addYears,
  eachDayOfInterval,
  getDay,
  getDaysInMonth,
  isAfter,
  isBefore,
  isSameMonth,
  isWithinInterval,
  lastDayOfMonth,
  startOfDay,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import { Timestamp } from "firebase/firestore";

export function recalculateBudget(params: {
  currentAvailableBudget: number;
  diffAmount: number;
}): number {
  const { currentAvailableBudget, diffAmount } = params;
  return currentAvailableBudget + diffAmount;
}

export function recalculateRentPayment(
  rent: number,
  interval: Interval
): number {
  if (interval === MONTHLY) return rent;
  if (interval === BIWEEKLY) return rent / 2;
  if (interval === WEEKLY) return rent / 4;
  return rent;
}

export function capitalizeFirstLetter(str: string | null): string {
  if (!str) return "";
  return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase();
}

export async function resetAllNvelopes(
  nvelopes: Envelope[],
  setEnvelopes: (e: Envelope[]) => void,
  userId: string
) {
  const updatedNvelopes = [...nvelopes].map((n) => {
    return { ...n, spent: 0, total: 0, paid: false };
  });
  await editEnvelopes(updatedNvelopes, userId);
  setEnvelopes(updatedNvelopes);
}

export function resetEnvelopesSpentToZero(envelopes: Envelope[]) {
  const updatedEnvelopes = [...envelopes].map((e) => {
    return { ...e, spent: 0 };
  });
  return updatedEnvelopes;
}

export function getOccurrencesOfWeekday(
  year: number,
  month: number,
  weekday: number
) {
  const start = new Date(year, month, 1);
  const end = lastDayOfMonth(start);
  const days = eachDayOfInterval({ start, end }).filter(
    (d) => getDay(d) === weekday
  );
  return {
    first: days[0] || null,
    second: days[1] || null,
    third: days[2] || null,
    fourth: days[3] || null,
  };
}

// Get the start date for the most recently occuring range of dates for a given interval
export function calculateCurrentIntervalStart(d: Date, i: Interval): Date {
  const start = startOfDay(d);
  const today = startOfDay(new Date());
  if (start > today) return calculateIntervalsFromFutureDate(i, start, today);
  else return calculateIntervalsFromPastDate(i, start, today);
}

export function calculateIntervalsFromPastDate(
  i: Interval,
  start: Date,
  today: Date
) {
  // Note: I've left both of these functions in place intentionally for readability
  switch (i) {
    case WEEKLY: {
      // Walk forward by weeks until start <= today
      while (isBefore(start, today)) {
        start = addWeeks(start, 1);
      }
      // If today IS the period start, return it directly (don't subtract)
      if (startOfDay(start).getTime() === startOfDay(today).getTime()) {
        return start;
      }
      return subWeeks(start, 1);
    }
    case BIWEEKLY: {
      while (isBefore(start, today)) {
        start = addWeeks(start, 2);
      }
      // If today IS the period start, return it directly (don't subtract)
      if (startOfDay(start).getTime() === startOfDay(today).getTime()) {
        return start;
      }
      return subWeeks(start, 2);
    }
    case MONTHLY: {
      while (isBefore(start, today)) {
        start = addMonths(start, 1);
      }
      // If today IS the period start, return it directly (don't subtract)
      if (startOfDay(start).getTime() === startOfDay(today).getTime()) {
        return start;
      }
      return subMonths(start, 1);
    }
    case YEARLY: {
      while (isBefore(start, today)) {
        start = addYears(start, 1);
      }
      // If today IS the period start, return it directly
      if (startOfDay(start).getTime() === startOfDay(today).getTime()) {
        return start;
      }
      return start;
    }
    default:
      console.error(`Unsupported interval: ${i}`);
      return today;
  }
}

export function calculateIntervalsFromFutureDate(
  i: Interval,
  start: Date,
  today: Date
): Date {
  // Note: I've left both of these functions in place intentionally for readability
  switch (i) {
    case WEEKLY: {
      // Walk backwards by weeks until start <= today
      while (isAfter(start, today)) {
        start = subWeeks(start, 1);
      }
      return start;
    }
    case BIWEEKLY: {
      while (isAfter(start, today)) {
        start = subWeeks(start, 2);
      }
      return start;
    }
    case MONTHLY: {
      while (isAfter(start, today)) {
        start = subMonths(start, 1);
      }
      return start;
    }
    case YEARLY: {
      while (isAfter(start, today)) {
        start = subYears(start, 1);
      }
      return start;
    }
    default:
      console.error(`Unsupported interval: ${i}`);
      return today;
  }
}

// Helper to return the start and end dates of a given interval based on a given date
export function getIntervalDateRange(i: Interval, start: Date): IntervalDates {
  let end = startOfDay(new Date(start));

  switch (i) {
    case WEEKLY:
      end = addWeeks(start, 1);
      break;
    case BIWEEKLY:
      end = addWeeks(start, 2);
      break;
    case MONTHLY:
      end = addMonths(start, 1);
      // Check month to ensure day exists (eg feb 30th...)
      if (end.getDate() !== start.getDate()) {
        end = lastDayOfMonth(subMonths(end, 1));
      }
      break;
    case YEARLY:
      end = addYears(start, 1);
      break;
    default:
      console.error(`Unsupported interval: ${i}`);
  }
  // Remove a day to prevent overlap
  end = subDays(end, 1);

  return {
    start,
    end,
  };
}

export function getNumberOfDaysFromInterval(i: Interval) {
  switch (i) {
    case "YEARLY":
      return 365;
    case "MONTHLY":
      return getDaysInMonth(new Date());
    case "BIWEEKLY":
      return 14;
    case "WEEKLY":
      return 7;
    default:
      return 0;
  }
}

export function getPaymentCurrentDueDate(p: Payment): Date {
  const originalDate = p.dueDate.toDate();
  const startOfCurrentPaymentInterval = calculateCurrentIntervalStart(
    originalDate,
    p.interval
  );
  const { end } = getIntervalDateRange(
    p.interval,
    startOfCurrentPaymentInterval
  );
  // console.log(`[getPaymentCurrentDueDate] checking ${p.name} to get current date. OriginalDueDate: ${originalDate}, startOfCurrentPaymentInterval: ${startOfCurrentPaymentInterval}, end: ${end}`)
  return end;
}

export function isDateInCurrentPayPeriod(
  payPeriodInterval: Interval,
  payDate: Date,
  d: Date
): boolean {
  const startOfCurrentPaymentInterval = calculateCurrentIntervalStart(
    payDate,
    payPeriodInterval
  );
  const { start, end } = getIntervalDateRange(
    payPeriodInterval,
    startOfCurrentPaymentInterval
  );
  // console.log(`[isDateInCurrentPayPeriod] payPeriodInterval: ${payPeriodInterval}, payDate: ${payDate}, dateToCheck: ${d} PayPeriodRange: START=${start} end=${end}`)
  return isWithinInterval(d, { start, end }); // Is the date within the current pay period
}

export function getCurrentIntervalDateRange(
  payPeriodInterval: Interval,
  payDate: Timestamp
) {
  const originalDate = payDate.toDate();
  const start = calculateCurrentIntervalStart(originalDate, payPeriodInterval);
  const { end } = getIntervalDateRange(payPeriodInterval, start);
  return { start, end };
}

export function getIncomeByInterval(
  oldInterval: Interval,
  newInterval: Interval,
  income: number
): number {
  // First convert the income to monthly so we can calculate the new income
  let monthlyIncome = 0;
  if (oldInterval === MONTHLY) {
    monthlyIncome = income;
  } else if (oldInterval === BIWEEKLY) {
    monthlyIncome = income * 2;
  } else if (oldInterval === WEEKLY) {
    monthlyIncome = income * 4;
  }
  // Now use the new interval to calculate the new income
  switch (newInterval) {
    case MONTHLY:
      return monthlyIncome;
    case WEEKLY:
      return monthlyIncome / 4;
    case BIWEEKLY:
      return monthlyIncome / 2;
    default:
      // If no viable option do nothing...
      return income;
  }
}

export async function updateBudgetStateAndDBB(
  amount: number,
  user: User,
  totalSpendingBudget: number,
  setTotalSpendingBudget: (totalSpendingBudget: number) => void
) {
  if (!user) return;
  const newBudget = totalSpendingBudget + amount;
  await editTotalSpendingBudget(newBudget, user.uid);
  setTotalSpendingBudget(newBudget);
}

export function paymentsTotal(
  payments: Payment[],
  payPeriodInterval: Interval,
  payDate: Timestamp
) {
  // Virtual Payments will map out any weekly/biweekly payments to get all occurances
  const virtualPayments = getVirtualPaymentsForPeriod(
    payments,
    payPeriodInterval,
    payDate
  );
  const totalMonthlyPayments = virtualPayments.reduce(
    (acc, p: Payment) => acc + p.amount,
    0
  );
  const currentBills = virtualPayments.reduce((acc, p: Payment) => {
    return p.type === "BILL" &&
      isDateInCurrentPayPeriod(
        payPeriodInterval,
        payDate.toDate(),
        getPaymentCurrentDueDate(p)
      )
      ? acc + p.amount
      : acc;
  }, 0);
  const currentDebts = virtualPayments.reduce((acc, p: Payment) => {
    return p.type === "DEBT" &&
      isDateInCurrentPayPeriod(
        payPeriodInterval,
        payDate.toDate(),
        getPaymentCurrentDueDate(p)
      )
      ? acc + p.amount
      : acc;
  }, 0);
  const monthlyDebts = virtualPayments.reduce((acc, p: Payment) => {
    return p.type === "DEBT" ? acc + p.amount : acc;
  }, 0);
  const totalBills = virtualPayments.reduce((acc, p: Payment) => {
    return p.type === "BILL" ? acc + p.amount : acc;
  }, 0);
  const remainingDebt = payments.reduce((acc, p: Payment) => {
    // remainingDebt uses payments array instead of virtualPayments because this is the remaining balance not the payment due.
    return p.type === "DEBT" && p.total ? acc + p.total : acc;
  }, 0);
  return {
    currentBills,
    totalBills,
    currentDebts,
    monthlyDebts,
    remainingDebt,
    totalMonthlyPayments,
  };
}

export function calculatePayoffDate(debt: Payment): Date | null {
  if (!debt.interestRate || !debt.total) return null;

  const L = debt.total;
  const p = debt.amount;

  const periodsPerYear =
    debt.interval === "MONTHLY" ? 12 : debt.interval === "BIWEEKLY" ? 26 : 52;

  const r = debt.interestRate / periodsPerYear;

  if (p <= L * r) {
    // payment too small to ever pay off
    return null;
  }

  const n = Math.log(p / (p - r * L)) / Math.log(1 + r);

  const years = n / periodsPerYear;
  const payoffDate = new Date();
  payoffDate.setFullYear(payoffDate.getFullYear() + years);
  return payoffDate;
}

export function transformIntervalMidSentence(i: Interval) {
  switch (i) {
    case "WEEKLY":
      return "week";
    case "BIWEEKLY":
      return "other week";
    case "MONTHLY":
      return "month";
    case "YEARLY":
      return "year";
  }
}

export const generateFreshPayment = () => {
  return {
    id: crypto.randomUUID(),
    name: "",
    type: undefined,
    amount: 0,
    paid: false,
    interval: undefined,
    dueDate: Timestamp.fromDate(new Date()),
  } as Payment;
};

/**
 * Adjusts a payment's dueDate to the current period, handling month cusp scenarios
 * Returns a new payment object without mutating the original
 */
export function adjustPaymentToCurrentPeriod(
  payment: Payment,
  payPeriodInterval: Interval,
  payDate: Timestamp
): Payment {
  const today = startOfDay(new Date());
  const isOnCusp = isTodayCuspDate(payPeriodInterval, payDate);
  const { start: periodStart, end: periodEnd } = getCurrentIntervalDateRange(
    payPeriodInterval,
    payDate
  );
  const payPeriodCrossesMonths =
    periodStart.getMonth() !== periodEnd.getMonth();
  const paymentDayNumber = payment.dueDate.toDate().getDate();
  const periodEndDayNumber = periodEnd.getDate();
  const shouldMoveToNextMonth =
    payPeriodCrossesMonths &&
    paymentDayNumber <= periodEndDayNumber &&
    isOnCusp;
  // console.log("current payperiod dates: ", { periodStart, periodEnd, payment: { ...payment, dueDate: payment.dueDate.toDate() }, payPeriodCrossesMonths, paymentDayNumber, periodEndDayNumber, shouldMoveToNextMonth, isOnCusp })

  const adjustedDueDate = new Date(
    today.getFullYear(),
    shouldMoveToNextMonth ? today.getMonth() + 1 : today.getMonth(),
    payment.dueDate.toDate().getDate()
  );

  return {
    ...payment,
    dueDate: Timestamp.fromDate(adjustedDueDate),
  };
}

/**
 * Checks if today is on a "cusp" where the current pay period extends into a different month.
 * Used to determine if monthly payments should be adjusted to show in the next month.
 * Returns true if the period end is in the future AND in a different month than today.
 */
export function isTodayCuspDate(payPeriod: Interval, payDate: Timestamp) {
  const today = startOfDay(new Date());
  const { end } = getCurrentIntervalDateRange(payPeriod, payDate);
  return isAfter(end, today) && end.getMonth() !== today.getMonth();
}

/**
 * Generates virtual payment instances for weekly/biweekly payments within the current pay period.
 * Returns an array of payment objects, one for each occurrence within periodStart to periodEnd.
 * For monthly/yearly payments, returns array with single adjusted payment.
 * Note: Correctly handles pay periods that cross month/year boundaries (e.g., Dec 25 → Jan 7).
 */
export function getMonthlyPaymentOccurrences(
  payment: Payment,
  payPeriodInterval: Interval,
  payDate: Timestamp
): Payment[] {
  // For monthly/yearly, return single adjusted payment
  if (payment.interval === MONTHLY || payment.interval === YEARLY) {
    return [adjustPaymentToCurrentPeriod(payment, payPeriodInterval, payDate)];
  }

  // For weekly/biweekly, calculate all occurrences in the period
  const occurrences: Payment[] = [];

  // Find the first occurrence in or before the period
  let currentDate = calculateCurrentIntervalStart(
    payment.dueDate.toDate(),
    payment.interval
  );

  // Use the actual pay period boundaries, not calendar month boundaries
  // This ensures payments are correctly shown even when pay periods cross year/month boundaries
  const { start: periodStart, end: periodEnd } = getCurrentIntervalDateRange(
    payPeriodInterval,
    payDate
  );

  // Walk forward and collect all occurrences in the period
  while (!isAfter(currentDate, periodEnd)) {
    if (
      isWithinInterval(currentDate, { start: periodStart, end: periodEnd })
    ) {
      const occurrenceTime = startOfDay(currentDate).getTime();
      const isPaid =
        payment.paidDates?.some(
          (pd) => startOfDay(pd.toDate()).getTime() === occurrenceTime
        ) ?? false;

      occurrences.push({
        ...payment,
        id: `${payment.id}-${payment.interval}-${currentDate.getTime()}`, // Unique ID for each occurrence
        paid: isPaid,
        dueDate: Timestamp.fromDate(currentDate),
      });
    }

    currentDate =
      payment.interval === WEEKLY
        ? addWeeks(currentDate, 1)
        : addWeeks(currentDate, 2);
  }

  return occurrences;
}

/**
 * Helper to get all virtual payment occurrences for display/calculation
 * Combines all payments with their occurrences expanded
 */
export function getVirtualPaymentsForPeriod(
  payments: Payment[],
  payPeriodInterval: Interval,
  payDate: Timestamp
): Payment[] {
  const virtualPayments: Payment[] = [];

  for (const payment of payments) {
    const occurrences = getMonthlyPaymentOccurrences(
      payment,
      payPeriodInterval,
      payDate
    );
    virtualPayments.push(...occurrences);
  }

  return virtualPayments.sort(
    (a, b) => a.dueDate.toMillis() - b.dueDate.toMillis()
  );
}

/*
 * Helper to remove the added -INTERVAL- from a virtual Payment
 */
export function removeVirtualIdPortion(p: Payment) {
  return p.id.split(`-${p.interval}`)[0];
}

export function getBackupDataFromTimestampString(ts: string, backups: Backup) {
  return backups.data.find((b) => b.backupTimeStamp.toString() === ts);
}

// Calculate a number of paychecks left in current month. Used for rent calculation during reset
export function getCountOfPaydatesLeftThisMonth(payDate: Timestamp, i: Interval) {
  const thisMonth = startOfDay(new Date())
  const {start} = getCurrentIntervalDateRange(i, payDate)
  let d = start;
  let c = 0
  while (isSameMonth(d, thisMonth)) {
    switch (i) {
      case "WEEKLY":
        c++; d = addWeeks(d, 1); break;
      case "BIWEEKLY":
        c++; d = addWeeks(d, 2); break;
      case "MONTHLY": return 1; 
    }
  }
  return c;
}