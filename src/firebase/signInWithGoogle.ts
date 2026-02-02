import type { User } from "firebase/auth";
import { signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth, googleProvider } from "./firebase";

/**
 * Sign in with Google using redirect flow only.
 * Redirect is used everywhere so behavior is consistent across browsers and devices:
 * - Popup fails when the user isn't already logged into Google (Chrome/Edge) or is
 *   blocked by third-party cookie/storage rules (Safari, Firefox).
 * - Redirect works reliably; the app calls getRedirectResult() on load (AuthProvider).
 */
export default async function signInWithGoogle(): Promise<User | void> {
  await signInWithRedirect(auth, googleProvider);
}

export { getRedirectResult };
