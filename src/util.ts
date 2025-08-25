import type { User } from "firebase/auth";
import type { Bill, Envelope, Interval, IntervalDates } from "./types";
import { editTotalSpendingBudget } from "./firebase/editData";
import { BIWEEKLY, DAY_IN_MILLIS, FIRST, FOURTH, MONTHLY, SECOND, THIRD, WEEKLY } from "./constants";

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

export function getAllOccurencesOfDate(d: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0)
    const freshMonth = new Date(today);
    const lastDay = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    let answer = {
      count: 0,
      first: new Date(today),
      second: new Date(today),
      third: new Date(today),
      fourth: new Date(today)
    }
    for (let i = 1; i <= lastDay; i++) {
      freshMonth.setDate(i)
      if (freshMonth.getDay() === d) answer.count++;
      switch(answer.count) {
        case 1:
          answer.first.setDate(i);
          break;
        case 2:
          answer.second.setDate(i);
          break;
        case 3:
          answer.third.setDate(i);
          break;
        case 4:
          answer.fourth.setDate(i);
          break;
      }
    }
    return answer;
  }


// Helper to return the start and end dates of a given interval
export function getIntervalDateRange(i: Interval, originalDate: Date): IntervalDates {
  originalDate.setHours(0, 0, 0, 0)
  const originalDateInMs = originalDate.getTime();
  let intervalsPassed;
  let start = new Date(), end = new Date(), today = new Date();
  today.setHours(0, 0, 0, 0)

  const elapsedDays = Math.floor((today.getTime() - originalDate.getTime()) / (DAY_IN_MILLIS))
  const monthsElapsed = (today.getFullYear() - originalDate.getFullYear()) * 12 + (today.getMonth() - originalDate.getMonth()) 
  switch(i) {
    case FIRST:
      const { first } = getAllOccurencesOfDate(originalDate.getDay());
      start = new Date(first);
      end = new Date(first);
      break;
    case SECOND:
      const { second } = getAllOccurencesOfDate(originalDate.getDay());
      start = new Date(second);
      end = new Date(second);
      break;
    case THIRD:
      const { third } = getAllOccurencesOfDate(originalDate.getDay());
      start = new Date(third);
      end = new Date(third);
      break;
    case FOURTH:
      const { fourth } = getAllOccurencesOfDate(originalDate.getDay());
      start = new Date(fourth);
      end = new Date(fourth);
      break;
    case WEEKLY:
      intervalsPassed = Math.floor(elapsedDays / 7);
      start.setTime(originalDateInMs + (intervalsPassed * 7 * DAY_IN_MILLIS))
      end.setDate(start.getDate() + 6)
      break
    case BIWEEKLY:
      intervalsPassed = Math.floor(elapsedDays / 14);
      start.setTime(originalDateInMs + (intervalsPassed * 14 * DAY_IN_MILLIS))
      end.setDate(start.getDate() + 13)
      break
    case MONTHLY:
      start = new Date(originalDate);
      start.setMonth(originalDate.getMonth() + monthsElapsed);
      end = new Date(start.getFullYear(), start.getMonth() + 1, start.getDate());
      // Check to see if the date exists next month and if not use the day before the month ahead of it
      end.setDate(Math.min(
        start.getDate(), 
        new Date(start.getFullYear(), start.getMonth() + 2, 0).getDate()
      ));
      end.setDate(end.getDate() - 1);
      break
    default:
      console.warn("Interval or date not handled properly: ", {i, originalDate})
  }
  return {
    start, end
  }
} 

export async function getBillCurrentDueDate(bill: Bill) {
  
}

export function isDateInInterval(i: Interval, d: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0)
    const { start, end } = getIntervalDateRange(i, d)
    return today >= start && today <= end;
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