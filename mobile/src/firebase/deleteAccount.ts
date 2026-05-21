import {
  deleteUser,
  reauthenticateWithPopup,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { auth, db, googleProvider } from "./firebase";

export type DeleteAccountResult =
  | { success: true }
  | { success: false; error: string }
  | { success: false; error: string; needPassword: true };

/**
 * Re-authenticates the current user (required by Firebase before deleteUser).
 * Uses only auth.currentUser — no external userId.
 * - Google: opens popup.
 * - Email/password: requires password (caller must pass it).
 */
type ReauthResult =
  | { success: true }
  | { success: false; error: string }
  | { success: false; needPassword: true; error: string };

async function reauthenticateUser(password?: string): Promise<ReauthResult> {
  const user = auth.currentUser;
  if (!user) return { success: false, error: "Not signed in" };

  const hasGoogle = user.providerData.some((p) => p.providerId === "google.com");
  const hasPassword = user.providerData.some((p) => p.providerId === "password");

  if (hasGoogle) {
    try {
      await reauthenticateWithPopup(user, googleProvider);
      return { success: true };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Sign-in was cancelled or failed";
      return { success: false, error: message };
    }
  }

  if (hasPassword) {
    if (!password?.trim()) {
      return { success: false, needPassword: true, error: "Password required" };
    }
    if (!user.email) {
      return { success: false, error: "No email on account" };
    }
    try {
      const credential = EmailAuthProvider.credential(user.email, password.trim());
      await reauthenticateWithCredential(user, credential);
      return { success: true };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Wrong password or sign-in failed";
      return { success: false, error: message };
    }
  }

  return { success: false, error: "Unsupported sign-in method" };
}

/**
 * Deletes the current user's Firebase Auth account and all Firestore data.
 * Re-authenticates first (Google popup or email/password with optional password).
 * Uses only auth.currentUser.uid — there is no API to delete another user's data.
 */
export async function deleteAccount(options?: { password?: string }): Promise<DeleteAccountResult> {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: "Not signed in" };
  }
  const uid = user.uid;

  const reauth = await reauthenticateUser(options?.password);
  if (!reauth.success) {
    if ("needPassword" in reauth && reauth.needPassword) {
      return { success: false, error: reauth.error, needPassword: true };
    }
    return { success: false, error: reauth.error };
  }

  try {
    const backupsRef = collection(db, "userBackups", uid, "backups");
    const snapshot = await getDocs(backupsRef);
    for (const d of snapshot.docs) {
      await deleteDoc(doc(db, "userBackups", uid, "backups", d.id));
    }
    await deleteDoc(doc(db, "users", uid));
    await deleteUser(user);
    return { success: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to delete account";
    return { success: false, error: String(message) };
  }
}
