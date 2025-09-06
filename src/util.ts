import type { User } from "firebase/auth";
import type { Payment, Envelope, Interval, IntervalDates } from "./types";
import { editTotalSpendingBudget, setDefaultBillInterval } from "./firebase/editData";
import { BIWEEKLY, MONTHLY, WEEKLY, YEARLY } from "./constants";
import { addMonths, addWeeks, addYears, differenceInWeeks, eachDayOfInterval, getDay, isWithinInterval, lastDayOfMonth, startOfDay } from "date-fns";

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
  return str.slice(0, 1).toUpperCase() + str.slice(1)
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

export function calculateCurrentIntervalStart(original: Date, i: Interval): Date {
    const today = startOfDay(new Date())
    const start = startOfDay(new Date(original))

    switch (i) {
      case WEEKLY: {
        const weeksPassed = differenceInWeeks(today, start);
        return addWeeks(start, weeksPassed);
      }
      case BIWEEKLY: {
        const biweeksPassed = differenceInWeeks(today, start) / 2
        return addWeeks(start, biweeksPassed * 2);
      }
      case MONTHLY: {
        const monthsPassed = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
        let startDate = addMonths(start, monthsPassed);
        if (startDate.getDate() !== start.getDate()) {
          startDate = lastDayOfMonth(startDate);
        }
        return startDate;
      }
      default:
        if (i === null) {
          return start;
        }
        console.error(`Unsupported interval: ${i}`);
        return new Date()
    }
}


// Helper to return the start and end dates of a given interval
export function getIntervalDateRange(i: Interval, originalDate: Date): IntervalDates {
  let start = calculateCurrentIntervalStart(originalDate, i);
  let end = new Date(start);

  switch (i) {
    case WEEKLY: end = addWeeks(start, 1); break;
    case BIWEEKLY: end = addWeeks(start, 2); break;
    case MONTHLY: end = addMonths(start, 1); break;
    case YEARLY: end = addYears(start, 1); break;
  }

  // For monthly, clamp end to last day if necessary
  if (i === MONTHLY && end.getDate() !== start.getDate()) {
    end = lastDayOfMonth(end);
  }

  return {
    start, end
  }
} 

export function getPaymentCurrentDueDate(p: Payment, user: User): Date {
  if (!p.interval) {
    setDefaultBillInterval(user.uid)
  }
  return calculateCurrentIntervalStart(p.dueDate.toDate(), p.interval);
}

export function isDateInCurrentPayPeriod(i: Interval, d: Date): boolean {
  const today = startOfDay(new Date());
  const { start, end } = getIntervalDateRange(i, d);
  return isWithinInterval(today, { start, end });
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

export function paymentsTotal(payments: Payment[]) {
  const totalBills = payments.reduce((acc, p: Payment) => {
    if (p.type === "BILL") return acc + p.amount
    else return 0
  }, 0)
  const totalDebts = payments.reduce((acc, p: Payment) => {
    if (p.type === "DEBT") return acc + p.amount
    else return 0
    }, 0)
  
  return {
    totalBills,
    totalDebts
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
