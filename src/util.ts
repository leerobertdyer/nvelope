import type { User } from "firebase/auth";
import type { Bill, Envelope, Interval } from "./types";
import { editTotalSpendingBudget } from "./firebase/editData";
import type { Timestamp } from "firebase/firestore";

export function recalculateBudget(params: {
    currentAvailableBudget: number;
    diffAmount: number;
  }): number {
    const { currentAvailableBudget, diffAmount } = params;
    return currentAvailableBudget + diffAmount
  }

  export function replenishEnvelopes(envelopes: Envelope[]) {
    const updatedEnvelopes = [...envelopes]
      .map(e => {
        if (e.saving) {
          // For envelopes that aren't reset, set total to leftover amount
          const leftoverAmount = e.total - e.spent;
          return { ...e, spent: 0, total: leftoverAmount };
        }
        // otherwise just clear spent to 0
        return { ...e, spent: 0 };
      });
    return updatedEnvelopes;
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
      return { intervalDays, today, endDate };
    }

export function isDateInInterval(dayOfMonth: number, interval: Interval, startDate: Timestamp): boolean {
    const today = new Date();
    const todayWithoutTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const originalStart = startDate.toDate();
    
    // Calculate the current/next pay period start date based on the interval pattern
    const currentStartDate = calculateCurrentPayPeriodStart(originalStart, interval);
    
    const { intervalDays } = getIntervalDates(interval);
    
    const endDate = new Date(currentStartDate);
    endDate.setDate(currentStartDate.getDate() + intervalDays);
    
    const nextPaymentDate = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
    
    // If the day has passed this month, look at next month
    if (nextPaymentDate < todayWithoutTime) {
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    }
    
    const billInInterval = nextPaymentDate >= currentStartDate && nextPaymentDate <= endDate;
    
    return billInInterval;
}

/**
 * Calculate the start date of the current pay period based on the original reference date and interval
 */
export function calculateCurrentPayPeriodStart(originalDate: Date, interval: Interval): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Clone the original date to avoid modifying it
    let periodStart = new Date(originalDate);
    periodStart.setHours(0, 0, 0, 0);
    
    // If the original date is in the future, use it as is
    if (periodStart > today) {
        return periodStart;
    }
    
    // If original date is in the past, find the most recent/current period start
    // based on the interval type
    if (interval === 'monthly') {
        // For monthly, advance by months until we find a start date <= today
        while (periodStart <= today) {
            const nextMonth = periodStart.getMonth() + 1;
            periodStart.setMonth(nextMonth);
            
            // If we've gone too far (into the future), go back one month
            if (periodStart > today) {
                periodStart.setMonth(periodStart.getMonth() - 1);
                break;
            }
        }
    } 
    else if (interval === 'biweekly') {
        // For biweekly, add 14 days until we find a start date <= today
        while (periodStart <= today) {
            const nextStart = new Date(periodStart);
            nextStart.setDate(nextStart.getDate() + 14);
            
            // If we've gone too far (into the future), keep the previous period
            if (nextStart > today) {
                break;
            }
            
            periodStart = nextStart;
        }
    }
    else if (interval === 'weekly') {
        // For weekly, add 7 days until we find a start date <= today
        while (periodStart <= today) {
            const nextStart = new Date(periodStart);
            nextStart.setDate(nextStart.getDate() + 7);
            
            // If we've gone too far (into the future), keep the previous period
            if (nextStart > today) {
                break;
            }
            
            periodStart = nextStart;
        }
    }
    
    return periodStart;
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