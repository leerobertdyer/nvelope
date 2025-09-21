import type { User } from "firebase/auth";
import type { Payment, Envelope, Interval, IntervalDates } from "./types";
import { editTotalSpendingBudget } from "./firebase/editData";
import { BILL, BIWEEKLY, MONTHLY, WEEKLY, YEARLY } from "./constants";
import { addMonths, addWeeks, addYears, eachDayOfInterval, getDay, isAfter, isBefore, isWithinInterval, lastDayOfMonth, startOfDay, subDays, subMonths, subWeeks, subYears } from "date-fns";
import { Timestamp } from "firebase/firestore";

export function recalculateBudget(params: {
  currentAvailableBudget: number;
  diffAmount: number;
}): number {
  const { currentAvailableBudget, diffAmount } = params;
  return currentAvailableBudget + diffAmount
}

export function recalculateRentPayment(rent: number, interval: Interval): number {
  if (interval === MONTHLY) return rent;
  if (interval === BIWEEKLY) return rent / 2;
  if (interval === WEEKLY) return rent / 4;
  return rent;
}

export function capitalizeFirstLetter(str: string | null): string {
  if (!str) return '';
  return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase()
}

export function replenishEnvelopes(envelopes: Envelope[]) {
  const updatedEnvelopes = [...envelopes]
    .map(e => {
      if (e.saving) {
        // For envelopes that aren't reset, set total to leftover amount
        const leftoverAmount = e.total - e.spent;
        return { ...e, spent: 0, total: leftoverAmount };
      }
      // otherwise clear spent to 0 and reset the total to the original amount
      return { ...e, total: e.resetTotal || 0, spent: 0 };
    });
  return updatedEnvelopes;
}

export function getOccurrencesOfWeekday(year: number, month: number, weekday: number) {
  const start = new Date(year, month, 1);
  const end = lastDayOfMonth(start);
  const days = eachDayOfInterval({ start, end }).filter(d => getDay(d) === weekday);
  return {
    first: days[0] || null,
    second: days[1] || null,
    third: days[2] || null,
    fourth: days[3] || null
  }
}

// Get the start date for the most recently occuring range of dates for a given interval
export function calculateCurrentIntervalStart(d: Date, i: Interval): Date {
  const start = startOfDay(d);
  const today = startOfDay(new Date());
  if (start > today)
    return calculateIntervalsFromFutureDate(i, start, today)
  else return calculateIntervalsFromPastDate(i, start, today);
}

export function calculateIntervalsFromPastDate(i: Interval, start: Date, today: Date) {
  switch (i) {
    case WEEKLY: {
      // Walk forward by weeks until start <= today
      while (isBefore(start, today)) {
        start = addWeeks(start, 1);
      }
      return subWeeks(start, 1);
    }
    case BIWEEKLY: {
      while (isBefore(start, today)) {
        start = addWeeks(start, 2);
      }
      return subWeeks(start, 2);
    }
    case MONTHLY: {
      while (isBefore(start, today)) {
        start = addMonths(start, 1);
      }
      return subMonths(start, 1);
    }
    case YEARLY: {
      while (isBefore(start, today)) {
        start = addYears(start, 1)
      }
      return start
    }
    default:
      console.error(`Unsupported interval: ${i}`);
      return today;
  }

}

export function calculateIntervalsFromFutureDate(i: Interval, start: Date, today: Date): Date {
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
        start = subYears(start, 1)
      }
      return start
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
    case WEEKLY: end = addWeeks(start, 1); break;
    case BIWEEKLY: end = addWeeks(start, 2); break;
    case MONTHLY: end = addMonths(start, 1);
      // Check month to ensure day exists (eg feb 30th...)
      if (end.getDate() !== start.getDate()) {
        end = lastDayOfMonth(subMonths(end, 1));
      }
      break;
    case YEARLY: end = addYears(start, 1); break;
    default:
      console.error(`Unsupported interval: ${i}`);
  }
  // Remove a day to prevent overlap
  end = subDays(end, 1);

  return {
    start, end
  }
}

export function getPaymentCurrentDueDate(p: Payment): Date {
  const originalDate = p.dueDate.toDate()
  const startOfCurrentPaymentInterval = calculateCurrentIntervalStart(originalDate, p.interval)
  const { end } = getIntervalDateRange(p.interval, startOfCurrentPaymentInterval)
  // console.log(`[getPaymentCurrentDueDate] checking ${p.name} to get current date. OriginalDueDate: ${originalDate}, startOfCurrentPaymentInterval: ${startOfCurrentPaymentInterval}, end: ${end}`)
  return end
}

export function isDateInCurrentPayPeriod(payPeriod: Interval, payDate: Date, d: Date): boolean {
  const startOfCurrentPaymentInterval = calculateCurrentIntervalStart(payDate, payPeriod)
  const { start, end } = getIntervalDateRange(payPeriod, startOfCurrentPaymentInterval); // Current Pay Period Date Range
  // console.log(`[isDateInCurrentPayPeriod] payPeriodInterval: ${payPeriod}, payDate: ${payDate}, dateToCheck: ${d} PayPeriodRange: START=${start} end=${end}`)
  return isWithinInterval(d, { start, end }); // Is the date within the current pay period
}

export function getIncomeByInterval(oldInterval: Interval, newInterval: Interval, income: number): number {
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

export async function addSubFromBudgetStateAndDB(amount: number, type: 'add' | 'sub', user: User, totalSpendingBudget: number, setTotalSpendingBudget: (totalSpendingBudget: number) => void) {
  if (!user) return;
  const newBudget = type === 'add' ? totalSpendingBudget + amount : totalSpendingBudget - amount;
  await editTotalSpendingBudget(newBudget, user.uid);
  setTotalSpendingBudget(newBudget);
}

export function paymentsTotal(payments: Payment[], payPeriodInterval: Interval, payDate: Timestamp) {
  const currentBills = payments.reduce((acc, p: Payment) => {
    return p.type === "BILL"
      && isDateInCurrentPayPeriod(payPeriodInterval, payDate.toDate(), getPaymentCurrentDueDate(p))
      ? acc + p.amount
      : acc
  }, 0)
  const currentDebts = payments.reduce((acc, p: Payment) => {
    return p.type === "DEBT"
      && isDateInCurrentPayPeriod(payPeriodInterval, payDate.toDate(), getPaymentCurrentDueDate(p))
      ? acc + p.amount
      : acc
  }, 0)
  const monthlyDebts = payments.reduce((acc, p: Payment) => {
    return p.type === "DEBT" ? acc + p.amount : acc;
  }, 0)
  const totalBills = payments.reduce((acc, p: Payment) => {
    return p.type === "BILL" ? acc + p.amount : acc
  }, 0)
  const totalDebts = payments.reduce((acc, p: Payment) => {
    return p.type === "DEBT" && p.total ? acc + p.total : acc
  }, 0)
  return {
    currentBills,
    totalBills,
    currentDebts,
    monthlyDebts,
    totalDebts,
  }
}

export function calculatePayoffDate(debt: Payment): Date | null {
  if (!debt.interestRate || !debt.total) return null

  const L = debt.total
  const p = debt.amount

  const periodsPerYear =
    debt.interval === "MONTHLY" ? 12 :
      debt.interval === "BIWEEKLY" ? 26 : 52

  const r = debt.interestRate / periodsPerYear

  if (p <= L * r) {
    // payment too small to ever pay off
    return null
  }

  const n = Math.log(p / (p - r * L)) / Math.log(1 + r)

  const years = n / periodsPerYear
  const payoffDate = new Date()
  payoffDate.setFullYear(payoffDate.getFullYear() + years)
  return payoffDate
}

export function transformIntervalMidSentence(i: Interval) {
  switch (i) {
    case "WEEKLY": return "week";
    case "BIWEEKLY": return "other week";
    case "MONTHLY": return "month";
    case "YEARLY": return "year"
  }
}

export const generateFreshPayment = () => { return { id: crypto.randomUUID(), name: "", type: BILL, amount: 0, paid: false, interval: MONTHLY, dueDate: Timestamp.fromDate(new Date) } as Payment }
