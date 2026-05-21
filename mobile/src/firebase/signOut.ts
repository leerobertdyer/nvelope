import {  signOut } from "firebase/auth";
import { auth } from "./firebase";

export default async function signout() {
    return signOut(auth).then(() => {
        console.log('User signed out successfully');
    }).catch((e) => {
        console.error(e)
    });
}
