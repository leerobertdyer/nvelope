import type { User } from "firebase/auth";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";

/**
 * True when the device is likely to have unreliable popup sign-in (e.g. iOS Safari, Android).
 * Use redirect flow on these devices so Google sign-in works on iPhone and mobile browsers.
 */
function isMobileOrUnreliablePopup(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod|Android/i.test(ua) || (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints > 2;
}

/**
 * Sign in with Google. Uses redirect on mobile (so it works on iPhone/Safari) and popup on desktop.
 * When redirect is used, the app must call getRedirectResult() on load (AuthProvider does this).
 */
export default async function signInWithGoogle(): Promise<User | void> {
  if (isMobileOrUnreliablePopup()) {
    await signInWithRedirect(auth, googleProvider);
    return;
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    const code = (error as { code?: string }).code;
    const message = (error as { message?: string }).message;
    console.error("Google sign-in failed:", { code, message });
    throw error;
  }
}

export { getRedirectResult };
