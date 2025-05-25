import type { Folder } from "../types";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export default async function editFolders(folders: Folder[], userId: string) {
    console.log("Firebase, editFolders Started")
    try {
        const userDocRef = doc(db, "users", userId);
        await setDoc(userDocRef, { folders });
        console.log('Firebase, editFolders Completed')
    } catch (error) {
        console.error("Firebase, editFolders Failed", error);
    }
    return;
}
