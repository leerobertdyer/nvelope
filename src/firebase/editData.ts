import type { Bill, Envelope, Interval, OneTimeCash, PreviousIntervalDetails } from "../types";
import { doc, updateDoc, Timestamp, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { User } from "firebase/auth";
import { calculateCurrentPayPeriodStart, getIntervalDates, isDateInInterval } from "../util";

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
    const sortedBills = bills.sort((a, b) => a.dayOfMonth - b.dayOfMonth)
    console.log(`Firebase, editBills Started, bills: ${sortedBills}`)
    try {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, { bills: sortedBills });
        console.log('Firebase, editBills Completed')
    } catch (error) {
        console.error("Firebase, editBills Failed", error);
    }
    return;
}

export async function editRent(amount: number, userId: string) {
    console.log(`Firebase, editRent started, amount=${amount}`)
    const rent = {
        name: 'rent',
        total: amount,
        spent: 0,
        recurring: true
    }
    try {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, { rent });
        console.log('Firebase, editRent Completed')
    } catch (error) {
        console.error("Firebase, editRent Failed", error);
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

export async function editOneTimeCashAndBudget(newCashEntry: OneTimeCash | null, userId: string, currentBudget: number) {
    console.log(`Firebase, editOneTimeCashAndBudget Started, newCashEntry: ${JSON.stringify(newCashEntry)}`)
    try {
        const userDocRef = doc(db, "users", userId);
        const docSnap = await getDoc(userDocRef);
        if (!newCashEntry) {
            await updateDoc(userDocRef, { oneTimeCash: [], totalSpendingBudget: currentBudget });
            console.log('Firebase, editOneTimeCashAndBudget Completed')
            return;
        }
        if (docSnap.exists()) {
            const { oneTimeCash } = docSnap.data() || [];
            const nextOneTimeCash = [...(oneTimeCash || []), newCashEntry];
            await updateDoc(userDocRef, { oneTimeCash: nextOneTimeCash, totalSpendingBudget: currentBudget + newCashEntry.amount });
            console.log('Firebase, editOneTimeCashAndBudget Completed')
        } else {
            console.error("Firebase, editOneTimeCashAndBudget Failed: Document does not exist");
        }
    } catch (error) {
        console.error("Firebase, editOneTimeCashAndBudget Failed", error);
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

export async function checkAndResetBudget(payDate: Timestamp, interval: Interval, envelopes: Envelope[], user: User, setEnvelopes: (envelopes: Envelope[]) => void, setTotalSpendingBudget: (totalSpendingBudget: number) => void, setOneTimeCash: (oneTimeCash: OneTimeCash[] | null) => void, income: number, totalSpendingBudget: number, bills: Bill[], oneTimeCash: OneTimeCash[] | null) {
    const currentDate = new Date();
    const originalPayDate = payDate.toDate();
    const currentPayPeriodStart = calculateCurrentPayPeriodStart(originalPayDate, interval);
    
    const { intervalDays } = getIntervalDates(interval);
    
    const endDate = new Date(currentPayPeriodStart);
    endDate.setDate(currentPayPeriodStart.getDate() + intervalDays);

    if (currentPayPeriodStart <= currentDate && currentDate <= endDate) {
        return;
    }
    
    // Calculate what's left in each envelope and if recurring
    const updatedEnvelopes = envelopes.filter(e => e.recurring).map(e => ({
        ...e,
            // Reset spent values here
            spent: 0
        }));
        
        const totalBillsInInterval = bills.reduce((acc, bill) => (
            isDateInInterval(bill.dayOfMonth, interval, Timestamp.fromDate(currentPayPeriodStart)) ? acc + bill.amount : acc
        ), 0);

        const totalOneTimeCash = oneTimeCash ? oneTimeCash.reduce((acc, cash) => (
            isDateInInterval(cash.date.toDate().getDate(), interval, Timestamp.fromDate(currentPayPeriodStart)) ? acc + cash.amount : acc), 0) : 0;

        const totalEnvelopes = updatedEnvelopes.reduce((acc, envelope) => acc + envelope.total, 0);

        const remainingBudget = income - totalBillsInInterval - totalOneTimeCash - totalEnvelopes

        // Before updating data and state, save the previous interval data
        const previousIntervalDetails = {
            payDate,
            interval,
            envelopes,
            bills,
            income,
            totalSpendingBudget,
            oneTimeCash
        }

        // Save data for future reporting
        await storePreviousIntervalDetails(previousIntervalDetails, user.uid);

        //reset OneTimeCash to empty array and update totalSpendingBudget
        await editOneTimeCashAndBudget(null, user.uid, remainingBudget);
        setTotalSpendingBudget(remainingBudget);
        setOneTimeCash([]);
        
        // Update envelopes if needed
        await editEnvelopes(updatedEnvelopes, user.uid);
        setEnvelopes(updatedEnvelopes);
        
        console.log("checkAndResetBudget() => Budget reset complete for interval:", interval);
};

export async function storePreviousIntervalDetails(previousIntervalDetails: PreviousIntervalDetails, userId: string) {
    console.log(`Firebase, storePreviousIntervalDetails Started, previousIntervalDetails: ${previousIntervalDetails}`)
    try {
        const userDocRef = doc(db, "users", userId);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const { previousIntervalDetails } = docSnap.data() || [];
            await updateDoc(userDocRef, { previousIntervalDetails: [...(previousIntervalDetails || []), previousIntervalDetails] });
            console.log('Firebase, storePreviousIntervalDetails Completed')
        } else {
            console.error("Firebase, storePreviousIntervalDetails Failed: Document does not exist");
        }
    } catch (error) {
        console.error("Firebase, storePreviousIntervalDetails Failed", error);
    }
    return;
}
