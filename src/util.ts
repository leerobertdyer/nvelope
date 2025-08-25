import type { User } from "firebase/auth";
import type { Bill, Envelope, Interval, IntervalDates } from "./types";
import { editTotalSpendingBudget, setDefaultBillInterval } from "./firebase/editData";
import { BIWEEKLY, FIRST, FOURTH, MONTHLY, SECOND, THIRD, WEEKLY } from "./constants";
import { addMonths, addWeeks, differenceInWeeks, eachDayOfInterval, getDay, isWithinInterval, lastDayOfMonth, startOfDay } from "date-fns";

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

function getOccurrencesOfWeekday(year: number, month: number, weekday: number) {
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
  function calculateCurrentIntervalStart(original: Date, interval: Interval): Date {
    const today = startOfDay(new Date())
    const start = startOfDay(new Date(original))

    switch (interval) {
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
        if (interval === undefined) {
        }
        throw new Error(`Unsupported interval: ${interval}`);
    }
}


// Helper to return the start and end dates of a given interval
export function getIntervalDateRange(i: Interval, originalDate: Date): IntervalDates {
  let start = calculateCurrentIntervalStart(originalDate, i);
  let end = new Date(start);
  const { first, second, third, fourth } = getOccurrencesOfWeekday(originalDate.getFullYear(), originalDate.getMonth(), originalDate.getDay());

  switch (i) {
    case FIRST:
      start = new Date(first);
      end = new Date(first);
      break;
    case SECOND:
      start = new Date(second);
      end = new Date(second);
      break;
    case THIRD:
      start = new Date(third);
      end = new Date(third);
      break;
    case FOURTH:
      start = new Date(fourth);
      end = new Date(fourth);
      break;
    case WEEKLY: end = addWeeks(start, 1); break;
    case BIWEEKLY: end = addWeeks(start, 2); break;
    case MONTHLY: end = addMonths(start, 1); break;
  }

  // For monthly, clamp end to last day if necessary
  if (i === MONTHLY && end.getDate() !== start.getDate()) {
    end = lastDayOfMonth(end);
  }

  return {
    start, end
  }
} 

export function getBillCurrentDueDate(bill: Bill, user: User): Date {
  if (!bill.interval) {
    setDefaultBillInterval(user.uid)
  }
  return calculateCurrentIntervalStart(bill.originalDate.toDate(), bill.interval);
}

export function isDateInInterval(i: Interval, d: Date): boolean {
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

export function billsTotal(bills: Bill[]) {
  return bills.reduce((acc: number, b: Bill) => acc + b.amount, 0)
}