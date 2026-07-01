import auth from "@react-native-firebase/auth";

export async function createLoginForExistingUser(email: string, password: string): Promise<void> {
  const user = auth().currentUser!;
  const credential = auth.EmailAuthProvider.credential(email, password);
  await user.linkWithCredential(credential);
}