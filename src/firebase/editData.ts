import type { Bill, Envelope, Interval, OneTimeCash } from "../types";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import type { User } from "firebase/auth";

export async function editEnvelopes(envelopes: Envelope[], userId: string) {
    console.log(`Firebase, editEnvelopes Started, envelopes: ${envelopes}`)
    try {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, { envelopes });
        console.log('Firebase, editEnvelopes Completed')
    } catch (error) {
        console.error("Firebase, editEnvelopes Failed", error);
    }
    return;
}

export async function editBills(bills: Bill[], userId: string) {
    console.log(`Firebase, editBills Started, bills: ${bills}`)
    try {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, { bills });
        console.log('Firebase, editBills Completed')
    } catch (error) {
        console.error("Firebase, editBills Failed", error);
    }
    return;
}

export async function editIncome(income: number, userId: string) {
    console.log(`Firebase, editIncome Started, income: ${income}`)
    try {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, { income });
        console.log('Firebase, editIncome Completed')
    } catch (error) {
        console.error("Firebase, editIncome Failed", error);
    }
    return;
}
    
export async function editInterval(interval: Interval, userId: string) {
    console.log(`Firebase, editInterval Started, interval: ${interval}`)
    try {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, { interval });
        console.log('Firebase, editInterval Completed')
    } catch (error) {
        console.error("Firebase, editInterval Failed", error);
    }
    return;
}

export async function editIsNewUser(isNewUser: boolean, userId: string) {
    console.log("Firebase, editIsNewUser Started, isNewUser: ", isNewUser)
    try {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, { isNewUser });
        console.log('Firebase, editIsNewUser Completed')
    } catch (error) {
        console.error("Firebase, editIsNewUser Failed", error);
    }
    return;
}

export async function editPayDate(payDate: Date, userId: string) {
    console.log(`Firebase, editPayDate Started, payDate: ${payDate.toDateString()}`)
    const date = Timestamp.fromDate(payDate);
    try {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, { payDate: date });
        console.log('Firebase, editPayDate Completed')
    } catch (error) {
        console.error("Firebase, editPayDate Failed", error);
    }
    return;
}

export async function editOneTimeCash(newCashEntry: OneTimeCash, userId: string, currentBudget: number) {
    console.log(`Firebase, editOneTimeCash Started, newCashEntry: ${JSON.stringify(newCashEntry)}`)
    try {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, { oneTimeCash: newCashEntry, totalSpendingBudget: currentBudget + newCashEntry.amount });
        console.log('Firebase, editOneTimeCash Completed')
    } catch (error) {
        console.error("Firebase, editOneTimeCash Failed", error);
    }
    return;
}

export async function editTotalSpendingBudget(newTotal: number, userId: string) {
    console.log(`Firebase, editTotalSpendingBudget Started, newTotal: ${newTotal}`)
    try {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, { totalSpendingBudget: newTotal });
        console.log('Firebase, editTotalSpendingBudget Completed')
    } catch (error) {
        console.error("Firebase, editTotalSpendingBudget Failed", error);
    }
    return;
}

export async function checkAndResetBudget(payDate: Timestamp, interval: Interval, envelopes: Envelope[], user: User, setPayDate: (payDate: Timestamp) => void, setEnvelopes: (envelopes: Envelope[]) => void, setTotalSpendingBudget: (totalSpendingBudget: number) => void, income: number, totalSpendingBudget: number) {
    const currentDate = new Date();
    const lastPayDate = payDate.toDate();
    const nextPayDate = new Date(lastPayDate);
    let shouldReset = false;

    // Calculate next pay date based on interval
    switch (interval) {
        case "weekly":
            nextPayDate.setDate(nextPayDate.getDate() + 7);
            break;
        case "biweekly":
            nextPayDate.setDate(nextPayDate.getDate() + 14);
            break;
        case "monthly":
            nextPayDate.setMonth(nextPayDate.getMonth() + 1);
            break;
        default:
            return; // Invalid interval
    }

    // If we've passed the next pay date, it's time to reset
    if (currentDate >= nextPayDate) {
        console.log("checkAndResetBudget() => Time to reset the budget!");
        shouldReset = true;
    } else {
        console.log("checkAndResetBudget() => No need to reset the budget.");
    }

    if (shouldReset) {
        // Calculate what's left in each envelope and if recurring
        const updatedEnvelopes = envelopes.filter(e => e.recurring).map(e => ({
            ...e,
            // Reset spent values here
            spent: 0
        }));

        // Update the pay date to the new pay date
        await editPayDate(nextPayDate, user.uid);
        setPayDate(Timestamp.fromDate(nextPayDate));
        
        // Set total spending budget to income plus any remaining budget
        await editTotalSpendingBudget(income + totalSpendingBudget, user.uid);
        setTotalSpendingBudget(income + totalSpendingBudget);
        
        // Update envelopes if needed
        await editEnvelopes(updatedEnvelopes, user.uid);
        setEnvelopes(updatedEnvelopes);
        
        console.log("checkAndResetBudget() => Budget reset complete for interval:", interval);
    }
};
