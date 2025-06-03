import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { User } from "firebase/auth";

export default async function loadUserData(user: User) {
    try {
        // Get reference to the specific user document
        const userDocRef = doc(db, "users", user.uid);
        
        // Try to get the document
        const userSnapshot = await getDoc(userDocRef);
        
        // If document exists, return the data
        if (userSnapshot.exists()) {
            return userSnapshot.data();
        } else {
            console.log("it doesn't exist")
            // If this is a new user, create a default document
            const defaultUserData = {
                id: user.uid,
                isNewUser: true,
                envelopes: [],
                payDate: null,
                interval: "",
                bills: [],
                email: user.email,
                income: 0,
                totalSpendingBudget: 0,
                oneTimeCash: null,
                rent: {name: 'rent', total: 0, spent: 0, recurring: true, id: 'rent'}
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
