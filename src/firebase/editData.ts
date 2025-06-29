import type { Bill, Envelope, Interval, OneTimeCash, OneTimeExpense, PreviousIntervalDetails } from "../types";
import { doc, updateDoc, Timestamp, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { User } from "firebase/auth";
import { calculateCurrentPayPeriodStart, getIntervalDates, isDateInInterval, replenishEnvelopes } from "../util";

export async function editShouldReset(shouldReset: Timestamp, userId: string) {
    try {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, { shouldReset });
    } catch (error) {
        console.error("Firebase, editShouldReset Failed", error);
    }
    return;
}

export async function editEnvelopes(envelopes: Envelope[], userId: string) {
    try {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, { envelopes });
    } catch (error) {
        console.error("Firebase, editEnvelopes Failed", error);
    }
    return;
}

export async function editBills(bills: Bill[], userId: string) {
    const sortedBills = bills.sort((a, b) => a.dayOfMonth - b.dayOfMonth)
    try {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, { bills: sortedBills });
    } catch (error) {
        console.error("Firebase, editBills Failed", error);
    }
    return;
}

export async function editRent(newRentAmount: number, userId: string) {
    try {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, { rent: newRentAmount });
    } catch (error) {
        console.error("Firebase, editRent Failed", error);
    }
    return;
}

export async function editIncome(income: number, userId: string) {
    try {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, { income });
    } catch (error) {
        console.error("Firebase, editIncome Failed", error);
    }
    return;
}
    
export async function editInterval(interval: Interval, userId: string) {
    try {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, { interval });
    } catch (error) {
        console.error("Firebase, editInterval Failed", error);
    }
    return;
}

export async function editIsNewUser(isNewUser: boolean, userId: string) {
    try {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, { isNewUser });
    } catch (error) {
        console.error("Firebase, editIsNewUser Failed", error);
    }
    return;
}

export async function editPayDate(payDate: Date, userId: string) {
    const date = Timestamp.fromDate(payDate);
    try {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, { payDate: date });
    } catch (error) {
        console.error("Firebase, editPayDate Failed", error);
    }
    return;
}

export async function editOneTimeExpense(newExpense: OneTimeExpense | null, userId: string) {
    try {
        const userDocRef = doc(db, "users", userId);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const { oneTimeExpense } = docSnap.data() || [];
            const nextOneTimeExpense = [...(oneTimeExpense || []), newExpense];
            await updateDoc(userDocRef, { oneTimeExpense: nextOneTimeExpense });
        } else {
            console.error("Firebase, editOneTimeExpense Failed: Document does not exist");
        }
    } catch (error) {
        console.error("Firebase, editOneTimeExpense Failed", error);
    }
    return;
}
    

export async function editOneTimeCashAndBudget(newCashEntry: OneTimeCash | null, userId: string, currentBudget: number) {
    try {
        const userDocRef = doc(db, "users", userId);
        const docSnap = await getDoc(userDocRef);
        if (!newCashEntry) {
            await updateDoc(userDocRef, { oneTimeCash: [], totalSpendingBudget: currentBudget });
            return;
        }
        if (docSnap.exists()) {
            const { oneTimeCash } = docSnap.data() || [];
            const nextOneTimeCash = [...(oneTimeCash || []), newCashEntry];
            await updateDoc(userDocRef, { oneTimeCash: nextOneTimeCash, totalSpendingBudget: currentBudget + newCashEntry.amount });
        } else {
            console.error("Firebase, editOneTimeCashAndBudget Failed: Document does not exist");
        }
    } catch (error) {
        console.error("Firebase, editOneTimeCashAndBudget Failed", error);
    }
    return;
}

export async function editTotalSpendingBudget(newTotal: number, userId: string) {
    try {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, { totalSpendingBudget: newTotal });
    } catch (error) {
        console.error("Firebase, editTotalSpendingBudget Failed", error);
    }
    return;
}

export function toUTCDateString(date: Date): string {
    return `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
  }
  
  async function isResetToday(payDate: Timestamp, interval: Interval, shouldReset: Timestamp | null) {
    if (!payDate || !interval) return false;
    const now = new Date();
    const todayUTC = toUTCDateString(now);
    console.log("isResetToday date check:", {
      now,
      todayUTC,
      shouldReset: shouldReset ? {
        timestamp: shouldReset,
        date: shouldReset.toDate(),
        utcString: toUTCDateString(shouldReset.toDate())
      } : null,
      isSameDay: shouldReset && toUTCDateString(shouldReset.toDate()) === todayUTC
    });
    
    // Prevent multiple resets on the same UTC day
    if (shouldReset && toUTCDateString(shouldReset.toDate()) === todayUTC) return false;
    
    const originalPayDate = payDate.toDate();
    const currentPayPeriodStart = calculateCurrentPayPeriodStart(originalPayDate, interval);
    const nextPayPeriodStart = new Date(currentPayPeriodStart);
    const { intervalDays } = getIntervalDates(interval);
    
    const nextPayPeriodEnd = new Date(nextPayPeriodStart);
    nextPayPeriodEnd.setDate(nextPayPeriodStart.getDate() + intervalDays);
    
    // If we're not already in the current pay period, don't reset again
    if (shouldReset) {
        const lastResetDate = shouldReset.toDate();
        console.log("isResetToday interval check:", {
          lastResetDate,
          nextPayPeriodStart,
          nextPayPeriodEnd,
          isInCurrentPeriod: lastResetDate >= nextPayPeriodStart && lastResetDate < nextPayPeriodEnd
        });
        
        if (
        lastResetDate >= nextPayPeriodStart &&
        lastResetDate < nextPayPeriodEnd
        ) {
        console.warn('Already reset during this pay period.');
        return false;
        }
    }
    return true;
}
  export async function checkAndResetBudget(
    shouldReset: Timestamp | null,
    payDate: Timestamp,
    interval: Interval,
    envelopes: Envelope[],
    user: User,
    setEnvelopes: (envelopes: Envelope[]) => void,
    setTotalSpendingBudget: (totalSpendingBudget: number) => void,
    setOneTimeCash: (oneTimeCash: OneTimeCash[] | null) => void,
    income: number,
    totalSpendingBudget: number,
    bills: Bill[],
    oneTimeCash: OneTimeCash[] | null,
    oneTimeExpenses: OneTimeExpense[] | null,
    setShouldReset: (shouldReset: Timestamp) => void
  ) {
    const resetToday = await isResetToday(payDate, interval, shouldReset);
    console.log("RESET TODAY: ", resetToday);
    if (!resetToday) return;

    const currentPayPeriodStart = calculateCurrentPayPeriodStart(payDate.toDate(), interval);
    console.log("checkAndResetBudget", {shouldReset, payDate, interval, envelopes, user, setEnvelopes, setTotalSpendingBudget, setOneTimeCash, income, totalSpendingBudget, bills, oneTimeCash, oneTimeExpenses});
    
    const updatedEnvelopes = replenishEnvelopes(envelopes);
  
    const totalBillsInInterval = bills.reduce((acc, bill) =>
      isDateInInterval(
        bill.dayOfMonth,
        interval,
        Timestamp.fromDate(currentPayPeriodStart)
      )
        ? acc + bill.amount
        : acc,
      0
    );
  
    const totalOneTimeCash = oneTimeCash
      ? oneTimeCash.reduce((acc, cash) =>
          isDateInInterval(
            cash.date.toDate().getDate(),
            interval,
            Timestamp.fromDate(currentPayPeriodStart)
          )
            ? acc + cash.amount
            : acc,
        0)
      : 0;

      const totalOneTimeExpenses = oneTimeExpenses
      ? oneTimeExpenses.reduce((acc, expense) =>
          isDateInInterval(
            expense.date.toDate().getDate(),
            interval,
            Timestamp.fromDate(currentPayPeriodStart)
          )
            ? acc + expense.amount
            : acc,
        0)
      : 0;

    const totalEnvelopes = updatedEnvelopes.reduce((acc, n) => {
        if (n.saving) {
          return acc;
        } else {
          return acc + n.spent;
        }
      }, 0
    );
  
    const remainingBudget = income - totalBillsInInterval + totalOneTimeCash - totalOneTimeExpenses - totalEnvelopes;
  
    const previousIntervalDetails = {
      payDate,
      interval,
      envelopes,
      bills,
      income,
      totalSpendingBudget,
      oneTimeCash,
    };
  
    await storePreviousIntervalDetails(previousIntervalDetails, user.uid);
  
    await editOneTimeCashAndBudget(null, user.uid, remainingBudget);
    setTotalSpendingBudget(remainingBudget);
    setOneTimeCash([]);
  
    await editEnvelopes(updatedEnvelopes, user.uid);
    setEnvelopes(updatedEnvelopes);
  
    const newShouldReset = Timestamp.now();
    await editShouldReset(newShouldReset, user.uid);
    setShouldReset(newShouldReset);
  }
    
export async function storePreviousIntervalDetails(latestIntervalDetails: PreviousIntervalDetails, userId: string) {
    try {
        const userDocRef = doc(db, "users", userId);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const { previousIntervalDetails } = docSnap.data() || [];
            await updateDoc(userDocRef, { previousIntervalDetails: [...(previousIntervalDetails || []), latestIntervalDetails] });
        } else {
            console.error("Firebase, storePreviousIntervalDetails Failed: Document does not exist");
        }
    } catch (error) {
        console.error("Firebase, storePreviousIntervalDetails Failed", error);
    }
    return;
}
