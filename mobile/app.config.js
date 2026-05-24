import "dotenv/config";

export default {
  expo: {
    name: "Nvelopes",
    slug: "mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      buildReactNativeFromSource: true,
      bundleIdentifier: "com.ldyer.nvelopes",
      googleServicesFile:
        process.env.GOOGLE_SERVICE_INFO_PLIST ?? "./GoogleService-Info.plist",
    },
    android: {
      package: "com.ldyer.nvelopes",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    plugins: [
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      ["expo-build-properties", { ios: { useFrameworks: "static" } }],
      [
        "@react-native-google-signin/google-signin",
        {
          iosUrlScheme: process.env.REVERSED_CLIENT_ID,
        },
      ],
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
  },
};
