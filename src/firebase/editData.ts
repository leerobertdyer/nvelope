import type { Bill, Envelope, Interval, OneTimeCash, PreviousIntervalDetails } from "../types";
import { doc, updateDoc, Timestamp, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { User } from "firebase/auth";
import { calculateBudgetByInterval } from "../util";

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

export async function checkAndResetBudget(payDate: Timestamp, interval: Interval, envelopes: Envelope[], user: User, setPayDate: (payDate: Timestamp) => void, setEnvelopes: (envelopes: Envelope[]) => void, setTotalSpendingBudget: (totalSpendingBudget: number) => void, income: number, totalSpendingBudget: number, bills: Bill[], oneTimeCash: OneTimeCash[] | null) {
    const currentDate = new Date();
    const lastPayDate = payDate.toDate();
    const nextPayDate = new Date(lastPayDate);
    let shouldReset = false;

    // Calculate next pay date based on interval
    switch (interval) {
        case "weekly":
            while (nextPayDate < currentDate) {
                nextPayDate.setDate(nextPayDate.getDate() + 7);
            }
            break;
        case "biweekly":
            while (nextPayDate < currentDate) {
                nextPayDate.setDate(nextPayDate.getDate() + 14);
            }
            break;
        case "monthly":
            while (nextPayDate < currentDate) {
                nextPayDate.setMonth(nextPayDate.getMonth() + 1);
            }
            break;
        default:
            console.log("RESET: no interval found. Skipping reset.")
            return; 
            // For now just returns
            // Eventually would like to default to a non-time based budget
            // Where user has a fixed amount income they can manually add to
            // And then they use envelopes that never reset 
            // Probably should have done this for mvp but I'm crazy
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

        let budget = calculateBudgetByInterval({
            income,
            interval,
            bills,
            envelopes,
            oneTimeCash: oneTimeCash || [],
        })

        console.log("RESET: next interval base income after bills: ", budget, "current totalSpendingBudget: ", totalSpendingBudget)

        budget = budget + totalSpendingBudget;

        console.log("RESET: next interval base income after bills and current totalSpendingBudget: ", budget)

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

        //reset OneTimeCash to empty array
        await editOneTimeCashAndBudget(null, user.uid, budget);

        // Update the pay date to the new pay date
        await editPayDate(nextPayDate, user.uid);
        setPayDate(Timestamp.fromDate(nextPayDate));
        
        // Set total spending budget to income plus any remaining budget
        await editTotalSpendingBudget(budget, user.uid);
        setTotalSpendingBudget(budget);
        
        // Update envelopes if needed
        await editEnvelopes(updatedEnvelopes, user.uid);
        setEnvelopes(updatedEnvelopes);
        
        console.log("checkAndResetBudget() => Budget reset complete for interval:", interval);
    }
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
