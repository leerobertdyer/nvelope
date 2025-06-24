import type { User } from "firebase/auth";
import type { Bill, Interval } from "./types";
import { editTotalSpendingBudget } from "./firebase/editData";

export function recalculateBudget(params: {
    currentAvailableBudget: number;
    diffAmount: number;
  }): number {
    const { currentAvailableBudget, diffAmount } = params;
    return currentAvailableBudget - diffAmount
  }

export function getIntervalDates(interval: Interval) {      
     // Calculate days in interval
     let intervalDays = 0;
     if (interval === 'monthly') {
       // Calculate days until end of month
       const today = new Date();
       const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
       intervalDays = lastDay - today.getDate() + 1; // +1 to include today
     } else if (interval === 'weekly') {
       intervalDays = 7;
     } else if (interval === 'biweekly') {
       intervalDays = 14;
     }    
      
      // Calculate the date range for the current interval
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + intervalDays);
      return { today, endDate };
    }

export function isDateInInterval(dayOfMonth: number, interval: Interval): boolean {
    const { today, endDate } = getIntervalDates(interval);
    
    // Create bill date for current month
    const billDate = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
    
    // For today comparison, remove time component
    const todayWithoutTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // First check if the bill is within the current month's interval
    if (billDate >= todayWithoutTime && billDate <= endDate) {
        return true;
    }
    
    // If date is in the past this month, check next month
    if (billDate < todayWithoutTime) {
        const nextMonthBillDate = new Date(today.getFullYear(), today.getMonth() + 1, dayOfMonth);
        return nextMonthBillDate <= endDate;
    }
    
    return false;
}

export function getIncomeByInterval(oldInterval: Interval, newInterval: Interval, income: number): number {
  // First convert the income to monthly so we can calculate the new income
  let monthlyIncome = 0;
  if (oldInterval === 'monthly') {
    monthlyIncome = income;
  } else if (oldInterval === 'biweekly') {
    monthlyIncome = income * 2;
  } else if (oldInterval === 'weekly') {
    monthlyIncome = income * 4;
  }
  // Now use the new interval to calculate the new income
  switch (newInterval) {
      case 'monthly':
          return monthlyIncome;
      case 'weekly':
          return monthlyIncome / 4;
      case 'biweekly':
          return monthlyIncome / 2;
      default:
          // If no viable option do nothing...
          return income;
  }
}

export async function addOrSubtractFromBudget(amount: number, type: 'add' | 'sub', user: User, totalSpendingBudget: number, setTotalSpendingBudget: (totalSpendingBudget: number) => void) {
    if (!user) return;
    const newBudget = type === 'add' ? totalSpendingBudget + amount : totalSpendingBudget - amount;
    await editTotalSpendingBudget(newBudget, user.uid);
    setTotalSpendingBudget(newBudget);
}

export function billsTotal(bills: Bill[]) {
  return bills.reduce((acc: number, b: Bill) => acc + b.amount, 0)
}