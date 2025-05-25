import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

export async function createUserEmailPass(email: string, password: string) {
   try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    if (userCredential) {
        // Signed up 
        const user = userCredential.user;
        console.log('User created successfully:', user);
        return user;
    }
   } catch (error: unknown) {
    const errorCode = (error as { code: string }).code;
    const errorMessage = (error as { message: string }).message;
    console.error('Error creating user:', { errorCode, errorMessage })
  }
}

export async function loginWithEmailAndPassword(email: string, password: string) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        if (userCredential) {
            // Signed in 
            const user = userCredential.user;
            console.log('User signed in successfully:', user);
            return user;
        }
    } catch (error: unknown) {
        const errorCode = (error as { code: string }).code;
        const errorMessage = (error as { message: string }).message;
        console.error('Error signing in:', { errorCode, errorMessage })
    }
}