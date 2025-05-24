import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export default async function loadUserData(userId: string) {
    try {
        // Get reference to the specific user document
        const userDocRef = doc(db, "users", userId);
        
        // Try to get the document
        const userSnapshot = await getDoc(userDocRef);
        
        // If document exists, return the data
        if (userSnapshot.exists()) {
            return userSnapshot.data();
        } else {
            // If this is a new user, create a default document
            const defaultUserData = {
                id: userId,
                folders: []
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
