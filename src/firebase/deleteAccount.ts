import { getAuth, deleteUser } from "firebase/auth";
import { deleteUserDataInFirestore } from "./editData";

export type DeleteAccountResult = { success: true } | { success: false; error: string };

/**
 * Deletes the current user's Firebase Auth account and all Firestore data.
 * Deletes Firestore first (user doc + backups), then Auth, so we still have uid.
 */
export async function deleteAccount(): Promise<DeleteAccountResult> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: "Not signed in" };
  }
  const uid = user.uid;
  try {
    await deleteUserDataInFirestore(uid);
    await deleteUser(user);
    return { success: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to delete account";
    return { success: false, error: String(message) };
  }
}
