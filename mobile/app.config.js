import "dotenv/config";
import appJson from "./app.json";

export default {
  ...appJson.expo,
  android: {
    ...appJson.expo.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
  },
  ios: {
    ...appJson.expo.ios,
    googleServicesFile: process.env.GOOGLE_SERVICE_INFO_PLIST ?? './GoogleService-Info.plist',
  },
  plugins: [
    '@react-native-firebase/app',
    '@react-native-firebase/auth',
    ['expo-build-properties', { ios: { useFrameworks: 'static' } }],
    ['@react-native-google-signin/google-signin', {
      iosUrlScheme: process.env.REVERSED_CLIENT_ID
    }]
  ],
  extra: {
    apiUrl: process.env.API_URL,
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID,
    measurementId: process.env.MEASUREMENT_ID,
    firebaseWebId: process.env.FIREBASE_WEB_ID,
  },
};