import auth from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import constants from "../../app.config"

// Configure once at app startup (App.tsx or similar)
GoogleSignin.configure({
  webClientId: constants.extra.firebaseWebId,
});

// Sign-in function
export async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();
  const idToken = response.data?.idToken;
  const credential = auth.GoogleAuthProvider.credential(idToken ?? '');
  return auth().signInWithCredential(credential);
}