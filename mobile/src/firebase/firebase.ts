import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// No initializeApp needed — auto-initialized via google-services.json / GoogleService-Info.plist
const app = firebase.app();
const db = firestore();
const googleProvider = null; // handled differently in RN — see signInWithGoogle

export { app, auth, db, googleProvider };