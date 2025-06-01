import type { User } from "firebase/auth";
import type { Bill, Envelope, Interval, OneTimeCash } from "./types";
import { editTotalSpendingBudget } from "./firebase/editData";

export function calculateBudgetByInterval(params: {
    income: number;
    interval: Interval;
    bills: Bill[];
    envelopes: Envelope[];
    oneTimeCash: OneTimeCash[];
  }): number {
    const { income, interval, bills, envelopes, oneTimeCash } = params;
    
    const billsTotal = bills ? bills.reduce((acc, bill) => acc + bill.amount, 0) : 0;
    const envelopesTotal = envelopes ? envelopes.reduce((acc, envelope) => acc + envelope.total, 0) : 0;
    const currentOneTimeCash = oneTimeCash ? oneTimeCash.filter((cash) => cash.date.toDate() >= new Date()) : [];
    const oneTimeCashTotal = currentOneTimeCash.length > 0 ? currentOneTimeCash.reduce((acc, cash) => acc + cash.amount, 0) : 0;
    
    let budget = 0;
    switch (interval) {
      case 'monthly':
        budget = income - billsTotal - envelopesTotal + oneTimeCashTotal;
        break;
      case 'weekly':
        budget = income - (billsTotal / 4) - envelopesTotal + oneTimeCashTotal;
        break;
      case 'biweekly':
        budget = income - (billsTotal / 2) - envelopesTotal + oneTimeCashTotal;
        break;
      default:
        // For default we return only oneTimeCashTotal
        // This will be used for non-time based budgets
        budget = oneTimeCashTotal;
        break;
    }
    
    return budget;
  }

  export async function addOrSubtractFromBudget(amount: number, type: 'add' | 'sub', user: User, totalSpendingBudget: number, setTotalSpendingBudget: (totalSpendingBudget: number) => void) {
    if (!user) return;
    const newBudget = type === 'add' ? totalSpendingBudget + amount : totalSpendingBudget - amount;
    await editTotalSpendingBudget(newBudget, user.uid);
    setTotalSpendingBudget(newBudget);
}


    