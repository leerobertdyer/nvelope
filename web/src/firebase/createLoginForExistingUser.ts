import { getAuth, linkWithCredential, EmailAuthProvider } from "firebase/auth";

export async function createLoginForExistingUser(email: string, password: string): Promise<void> {
  const auth = getAuth();
  const user = auth.currentUser!;
  const credential = EmailAuthProvider.credential(email, password);
  await linkWithCredential(user, credential);
}
