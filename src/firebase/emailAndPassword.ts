import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { auth } from "./firebase";

/**
 * Sends Firebase password reset email. For the email to be delivered and the link to work:
 * - Firebase Console > Authentication > Sign-in method: "Email/Password" must be enabled.
 * - Authentication > Settings > Authorized domains: add your app's domain (e.g. localhost, your Vercel domain).
 *
 * The link's "continue" URL must be a reachable HTTPS URL. If you request reset from localhost,
 * set VITE_APP_URL in .env to your production URL (e.g. https://yourapp.vercel.app) so the link
 * redirects there after reset instead of to localhost (which Safari/other devices can't open).
 */
export async function sendPasswordResetEmailToUser(email: string): Promise<void> {
  const productionUrl = import.meta.env.VITE_APP_URL as string | undefined;
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
  // Use production URL when set, or current origin only if it's not localhost (so the link works in Safari)
  const continueUrl = productionUrl || (!isLocalhost ? origin : null);
  const actionCodeSettings =
    continueUrl && typeof window !== "undefined"
      ? { url: continueUrl, handleCodeInApp: false }
      : undefined;
  await sendPasswordResetEmail(auth, email, actionCodeSettings);
}

export async function getSignInMethodsForEmail(email: string): Promise<string[]> {
  return fetchSignInMethodsForEmail(auth, email);
}

export async function createUserEmailPass(email: string, password: string) {
   try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    if (userCredential) {
        const user = userCredential.user;
        return user;
    }
   } catch (error: unknown) {
    const errorCode = (error as { code: string }).code;
    const errorMessage = (error as { message: string }).message;
    console.error('Error creating user:', { errorCode, errorMessage });
    throw error;
  }
}

export async function loginWithEmailAndPassword(email: string, password: string) {
 console.log("IN THE FUNCTION")
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        console.log("USER CREDS: ", userCredential)
        if (userCredential) {
            const user = userCredential.user;
            return user;
        }
    } catch (error: unknown) {
      console.log("ERROR IN CATCH: ", error)
        const errorCode = (error as { code: string }).code;
        const errorMessage = (error as { message: string }).message;
        console.error('Error signing in:', { errorCode, errorMessage })
        throw error;
    }
}