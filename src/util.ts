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
  endOfMonth,
  getDay,
  getDaysInMonth,
  isAfter,
  isBefore,
  isWithinInterval,
  lastDayOfMonth,
  startOfDay,
  startOfMonth,
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

  // For SPLIT payments: divide monthly amount across user's pay periods
  if (payment.interval === "SPLIT") {
    return getSplitPaymentOccurrences(payment, payPeriodInterval, payDate);
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
 * Generate virtual payment occurrences for SPLIT payments.
 * 
 * Two modes:
 * - recurring: true (or undefined) - Monthly recurring like rent, splits across current month's pay periods
 * - recurring: false - Save-up mode, splits from today until target dueDate
 * 
 * For example: $2000/month rent with weekly pay periods in a 4-week month = 4 payments of $500 each
 */
function getSplitPaymentOccurrences(
  payment: Payment,
  payPeriodInterval: Interval,
  payDate: Timestamp
): Payment[] {
  const occurrences: Payment[] = [];
  const today = startOfDay(new Date());
  
  // Determine mode: recurring (monthly) vs save-up (target date)
  const isRecurring = payment.recurring !== false; // Default to recurring for backwards compat
  
  let rangeStart: Date;
  let rangeEnd: Date;
  let periodCount: number;
  
  if (isRecurring) {
    // RECURRING MODE: Use current month boundaries
    rangeStart = startOfMonth(today);
    rangeEnd = endOfMonth(today);
    periodCount = getPayPeriodsInMonth(payDate, payPeriodInterval, today);
  } else {
    // SAVE-UP MODE: Calculate split amount using ALL periods until target,
    // but only DISPLAY current pay period's occurrences (like WEEKLY/BIWEEKLY)
    const targetDate = startOfDay(payment.dueDate.toDate());
    
    // If target date has passed, show nothing (will be handled by modal)
    if (targetDate < today) {
      return [];
    }
    
    // Use all periods until target for amount calculation
    periodCount = getPayPeriodsUntilDate(payDate, payPeriodInterval, targetDate);
    
    // Use current pay period for display (consistent with WEEKLY/BIWEEKLY behavior)
    const { start: periodStart, end: periodEnd } = getCurrentIntervalDateRange(
      payPeriodInterval,
      payDate
    );
    rangeStart = periodStart;
    // End at target date if it's within current period, otherwise period end
    rangeEnd = targetDate < periodEnd ? targetDate : periodEnd;
  }
  
  // Calculate the split amount per period
  const splitAmount = Number((payment.amount / periodCount).toFixed(2));
  
  // payDate is the user's original/first paycheck date (always in the past)
  // Step forward from that anchor to find the first pay date in the range
  let currentPayDate = startOfDay(payDate.toDate());
  
  while (currentPayDate < rangeStart) {
    if (payPeriodInterval === WEEKLY) {
      currentPayDate = addWeeks(currentPayDate, 1);
    } else if (payPeriodInterval === BIWEEKLY) {
      currentPayDate = addWeeks(currentPayDate, 2);
    } else {
      // For monthly payPeriodInterval, just use rangeStart
      currentPayDate = rangeStart;
      break;
    }
  }
  
  // Generate virtual payments for each pay date in the range
  while (currentPayDate <= rangeEnd) {
    const occurrenceTime = startOfDay(currentPayDate).getTime();
    const isPaid = payment.paidDates?.some(
      (pd) => startOfDay(pd.toDate()).getTime() === occurrenceTime
    ) ?? false;
    
    occurrences.push({
      ...payment,
      id: `${payment.id}-SPLIT-${currentPayDate.getTime()}`,
      amount: splitAmount,
      paid: isPaid,
      dueDate: Timestamp.fromDate(currentPayDate),
    });
    
    // Move to next pay period
    if (payPeriodInterval === WEEKLY) {
      currentPayDate = addWeeks(currentPayDate, 1);
    } else if (payPeriodInterval === BIWEEKLY) {
      currentPayDate = addWeeks(currentPayDate, 2);
    } else {
      // For monthly payPeriodInterval, only one occurrence
      break;
    }
  }
  
  // Ensure at least one occurrence (edge case)
  if (occurrences.length === 0) {
    occurrences.push({
      ...payment,
      id: `${payment.id}-SPLIT-${rangeStart.getTime()}`,
      amount: payment.amount, // Full amount if only one period
      paid: payment.paid,
      dueDate: Timestamp.fromDate(rangeStart),
    });
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

/**
 * Calculate total number of pay periods in a given month.
 * Used for SPLIT payment calculations to divide monthly amounts across pay periods.
 * 
 * @param payDate - User's pay date (used to align pay periods)
 * @param interval - User's pay period interval (WEEKLY, BIWEEKLY, MONTHLY)
 * @param targetMonth - Optional: the month to calculate for (defaults to current month)
 * @returns Number of pay periods in the month
 */
export function getPayPeriodsInMonth(
  payDate: Timestamp,
  interval: Interval,
  targetMonth: Date = new Date()
): number {
  if (!interval || interval === "YEARLY" || interval === "SPLIT") {
    // YEARLY and SPLIT don't make sense here, MONTHLY is always 1
    return 1;
  }
  
  if (interval === "MONTHLY") {
    return 1;
  }
  
  const monthStart = startOfMonth(targetMonth);
  const monthEnd = endOfMonth(targetMonth);
  
  // payDate is the user's original/first paycheck date (always in the past)
  // Step forward from that anchor to find the first pay date in the target month
  let currentPayDate = startOfDay(payDate.toDate());
  
  while (currentPayDate < monthStart) {
    if (interval === "WEEKLY") {
      currentPayDate = addWeeks(currentPayDate, 1);
    } else if (interval === "BIWEEKLY") {
      currentPayDate = addWeeks(currentPayDate, 2);
    }
  }
  
  // Count all pay periods in the month
  let count = 0;
  while (currentPayDate <= monthEnd) {
    count++;
    if (interval === "WEEKLY") {
      currentPayDate = addWeeks(currentPayDate, 1);
    } else if (interval === "BIWEEKLY") {
      currentPayDate = addWeeks(currentPayDate, 2);
    }
  }
  
  // Ensure at least 1 period (edge case protection)
  return Math.max(count, 1);
}

/**
 * Calculate total number of pay periods from today until a target date.
 * Used for SPLIT save-up mode to divide a target amount across remaining pay periods.
 * 
 * @param payDate - User's pay date (used to align pay periods)
 * @param payPeriodInterval - User's pay period interval (WEEKLY, BIWEEKLY, MONTHLY)
 * @param targetDate - The target date to save up until
 * @returns Number of pay periods from today until target date
 */
export function getPayPeriodsUntilDate(
  payDate: Timestamp,
  payPeriodInterval: Interval,
  targetDate: Date
): number {
  if (!payPeriodInterval || payPeriodInterval === "YEARLY" || payPeriodInterval === "SPLIT") {
    return 1;
  }
  
  if (payPeriodInterval === "MONTHLY") {
    // Count months from now until target
    const today = startOfDay(new Date());
    const target = startOfDay(targetDate);
    let count = 0;
    let current = today;
    while (current <= target) {
      count++;
      current = addMonths(current, 1);
    }
    return Math.max(count, 1);
  }
  
  const today = startOfDay(new Date());
  const target = startOfDay(targetDate);
  
  // payDate is the user's original/first paycheck date (always in the past)
  // Step forward from that anchor to find the first pay date on or after today
  let currentPayDate = startOfDay(payDate.toDate());
  
  while (currentPayDate < today) {
    if (payPeriodInterval === "WEEKLY") {
      currentPayDate = addWeeks(currentPayDate, 1);
    } else if (payPeriodInterval === "BIWEEKLY") {
      currentPayDate = addWeeks(currentPayDate, 2);
    }
  }
  
  // Count all pay periods from today until target date
  let count = 0;
  while (currentPayDate <= target) {
    count++;
    if (payPeriodInterval === "WEEKLY") {
      currentPayDate = addWeeks(currentPayDate, 1);
    } else if (payPeriodInterval === "BIWEEKLY") {
      currentPayDate = addWeeks(currentPayDate, 2);
    }
  }
  
  // Ensure at least 1 period
  return Math.max(count, 1);
}