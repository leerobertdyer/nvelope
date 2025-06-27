import { getAuth, linkWithCredential, EmailAuthProvider } from "firebase/auth";

export function createLoginForExistingUser(email: string, password: string) {

const auth = getAuth();
const user = auth.currentUser!;

const credential = EmailAuthProvider.credential(email, password);

linkWithCredential(user, credential)
  .then((usercred) => {
    // Account linking successful
    const user = usercred.user;
    console.log("Account linking success", user);
  })
  .catch((error) => {
    // Account linking failed
    console.log("Account linking error", error);
  });
}
