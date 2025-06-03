import type { User } from "firebase/auth";
import type { Bill, Envelope, Interval, OneTimeCash } from "./types";
import { editTotalSpendingBudget } from "./firebase/editData";

export function calculateBudgetByInterval(params: {
    income: number;
    interval: Interval;
    bills: Bill[];
    envelopes: Envelope[];
    oneTimeCash: OneTimeCash[] | null;
  }): number {
    const { income, interval, bills, envelopes, oneTimeCash } = params;

    // If interval is fixed, we don't need to calculate bills
    if (interval === "fixed") {
      const oneTimeCashTotal = oneTimeCash && oneTimeCash.length > 0 ? oneTimeCash.reduce((acc, cash) => acc + cash.amount, 0) : 0;
      return oneTimeCashTotal;
    }
    
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
    
    const billTotalForInterval = bills ? bills.reduce((acc, bill) => {
      // Create a date object for this bill's due date in current month
      const billDate = new Date(today.getFullYear(), today.getMonth(), bill.dayOfMonth);
      
      // If the bill date is in the past this month, it might be due next month
      if (billDate < today) {
        // Check if it falls in our interval by creating a date for next month
        const nextMonthBillDate = new Date(today.getFullYear(), today.getMonth() + 1, bill.dayOfMonth);
        if (nextMonthBillDate <= endDate) {
          return acc + bill.amount; // Bill is due within our interval (in the next month)
        }
      } 
      // Otherwise check if the bill date is within our interval
      else if (billDate <= endDate) {
        return acc + bill.amount; // Bill is due within our interval (in the current month)
      }
      
      return acc; // Skip if not within our interval
    }, 0) : 0;

    const envelopesTotal = envelopes ? envelopes.reduce((acc, envelope) => acc + envelope.total, 0) : 0;
    const oneTimeCashTotal = oneTimeCash && oneTimeCash.length > 0 ? oneTimeCash.reduce((acc, cash) => acc + cash.amount, 0) : 0;
    
    // Calculate the budget
    const budget = income - billTotalForInterval - envelopesTotal + oneTimeCashTotal;
    
    return budget;
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