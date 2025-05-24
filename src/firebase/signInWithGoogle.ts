import {  signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, googleProvider } from "./firebase";

export default async function signInWithGoogle() {
  console.log('Starting Google sign-in process');
  return signInWithPopup(auth, googleProvider)
    .then((result) => {
      // This gives you a Google Access Token. You can use it to access the Google API.
      // const credential = GoogleAuthProvider.credentialFromResult(result);
      // const token = credential?.accessToken;
      // The signed-in user info.
    const user = result.user;
    console.log('Sign-in successful, user:', user);
    console.log('User displayName:', user.displayName);
    console.log('User email:', user.email);
    // IdP data available using getAdditionalUserInfo(result)
    return user
  }).catch((error) => {
    // Handle Errors here.
    const errorCode = error.code;
    const errorMessage = error.message;
    // The email of the user's account used.
    const email = error.customData.email;
    // The AuthCredential type that was used.
    const credential = GoogleAuthProvider.credentialFromError(error);
    console.error('Google sign-in failed:', {
      errorCode,
      errorMessage,
      email,
      credential
    });
    throw error;
  });
}