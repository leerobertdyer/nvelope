import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { User } from "firebase/auth";
import { importAndTransformLegacyBills } from "./editData";

export default async function loadUserData(user: User) {
    try {
        // Get reference to the specific user document
        const userDocRef = doc(db, "users", user.uid);

        // @TODO: legacy transformer for old "Bills" array moving into Payments
        await importAndTransformLegacyBills(user.uid)
        
        // Try to get the document
        const userSnapshot = await getDoc(userDocRef);
        
        // If document exists, return the data
        if (userSnapshot.exists()) {
            return userSnapshot.data();
        } else {
            console.log("User doesn't exist")
            // If this is a new user, create a default document
            const defaultUserData = {
                id: user.uid,
                isNewUser: true,
                envelopes: [],
                payDate: null,
                payPeriodInterval: "MONTHLY",
                payments: [],
                email: user.email,
                income: 0,
                totalSpendingBudget: 0,
                oneTimeCash: null,
                rent: 0,
                resetBudgetTimestamp: null,
                oneTimeExpenses: null
            };
            
            // Create the user document
            await setDoc(userDocRef, defaultUserData);
            
            return defaultUserData;
        }
    } catch (error) {
        console.error("Error loading user data:", error);
        throw error;
    }
}
