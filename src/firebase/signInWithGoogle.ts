import type { User } from "firebase/auth";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "./firebase";

export default async function signInWithGoogle(): Promise<User> {
  const { user } = await signInWithPopup(auth, googleProvider);
  return user;
}
