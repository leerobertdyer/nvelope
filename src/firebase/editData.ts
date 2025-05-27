import type { Bill, Folder, Interval } from "../types";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";

export async function editFolders(folders: Folder[], userId: string) {
    console.log(`Firebase, editFolders Started, folders: ${folders}`)
    try {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, { folders });
        console.log('Firebase, editFolders Completed')
    } catch (error) {
        console.error("Firebase, editFolders Failed", error);
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
