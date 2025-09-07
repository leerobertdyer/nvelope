import type { User } from "firebase/auth";
import type { Payment, Envelope, Interval, IntervalDates } from "./types";
import { editTotalSpendingBudget } from "./firebase/editData";
import { BIWEEKLY, MONTHLY, WEEKLY, YEARLY } from "./constants";
import { addMonths, addWeeks, addYears, eachDayOfInterval, getDay, isAfter, isBefore, isWithinInterval, lastDayOfMonth, startOfDay, subMonths, subWeeks, subYears } from "date-fns";

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

export function calculateCurrentIntervalStart(d: Date, i: Interval): Date {
  const start = startOfDay(d);
  const today = startOfDay(new Date());

  if (start > today) 
    return  calculateIntervalsFromFutureDate(i, start, today)
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


// Helper to return the start and end dates of a given interval
export function getIntervalDateRange(i: Interval, d: Date): IntervalDates {
  const start = calculateCurrentIntervalStart(d, i);
  let end;


  switch (i) {
    case WEEKLY: end = addWeeks(start, 1); break;
    case BIWEEKLY: end = addWeeks(start, 2); break;
    case MONTHLY: end = addMonths(start, 1);
      if (end.getDate() !== start.getDate()) end = lastDayOfMonth(end);
      break;
    case YEARLY: end = addYears(start, 1); break;
    default:
      console.error(`Unsupported interval: ${i}`);
      end = addWeeks(start, 1);
  }

  // For monthly, clamp end to last day if necessary
  if (i === MONTHLY && end.getDate() !== start.getDate()) {
    end = lastDayOfMonth(end);
  }

  return {
    start, end
  }
} 

export function getPaymentCurrentDueDate(p: Payment): Date {
  return calculateCurrentIntervalStart(p.dueDate.toDate(), p.interval);
}

export function isDateInCurrentPayPeriod(payPeriod: Interval, d: Date): boolean {
  const { start, end } = getIntervalDateRange(payPeriod, d);
  return isWithinInterval(d, { start, end });
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

