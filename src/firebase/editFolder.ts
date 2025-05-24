import type { Folder } from "../types";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export default async function editFolders(folders: Folder[], userId: string) {
    const userDocRef = doc(db, "users", userId);
    return setDoc(userDocRef, { folders });
}
